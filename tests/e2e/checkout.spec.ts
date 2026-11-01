import { execFileSync } from 'node:child_process';
import { expect, Page, test } from '@playwright/test';

/**
 * Hợp đồng selector (data-testid) mà apps/web cần cung cấp:
 *  - Menu:        product-card
 *  - Chi tiết:    size-option-<S|M|L>, topping-option, add-to-cart-button
 *  - Giỏ hàng:    cart-link, cart-item, checkout-button
 *  - Auth:        auth-name (chỉ ở form đăng ký), auth-email, auth-password, auth-submit, auth-switch-register
 *  - Checkout:    payment-method-wallet, confirm-payment-button, payment-error
 *  - Xác nhận:    order-status (trang /orders/:id)
 */

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001';

type PaymentMode = 'success' | 'failure';

function setApiPaymentMode(mode: PaymentMode): void {
  execFileSync('docker', ['compose', 'up', '-d', '--no-deps', '--force-recreate', 'api'], {
    env: { ...process.env, MOCK_PAYMENT_MODE: mode },
    stdio: 'inherit',
  });
}

async function waitForApiHealthy(): Promise<void> {
  await expect
    .poll(
      async () => {
        try {
          const res = await fetch(`${API_URL}/health`);
          return res.status;
        } catch {
          return 0;
        }
      },
      { timeout: 120_000, intervals: [1_000, 2_000, 5_000] },
    )
    .toBe(200);
}

async function switchPaymentMode(mode: PaymentMode): Promise<void> {
  setApiPaymentMode(mode);
  await waitForApiHealthy();
}

async function addFirstProductToCart(page: Page): Promise<void> {
  await page.goto('/menu');
  const firstProduct = page.getByTestId('product-card').first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();

  await page.getByTestId('size-option-M').click();
  await page.getByTestId('topping-option').first().click();
  await page.getByTestId('add-to-cart-button').click();
}

async function registerAndReturnToCheckout(page: Page, email: string): Promise<void> {
  await expect(page).toHaveURL(/\/auth\/login/);
  await page.getByTestId('auth-switch-register').click();
  await expect(page).toHaveURL(/\/auth\/register/);

  const nameInput = page.getByTestId('auth-name');
  if (await nameInput.count()) {
    await nameInput.fill('E2E Customer');
  }
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('secret123');
  await page.getByTestId('auth-submit').click();

  await expect(page).toHaveURL(/\/checkout/);
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@brewlite.test`;
}

test.describe.serial('Checkout flow', () => {
  test.afterAll(async () => {
    await switchPaymentMode('success');
  });

  test('E2E-T01: thanh toán thành công bằng Ví → đơn PAID', async ({ page }) => {
    await addFirstProductToCart(page);

    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByTestId('cart-item')).toHaveCount(1);

    await page.getByTestId('checkout-button').click();
    await registerAndReturnToCheckout(page, uniqueEmail('e2e-success'));

    await page.getByTestId('payment-method-wallet').click();
    await page.getByTestId('confirm-payment-button').click();

    await expect(page).toHaveURL(/\/orders\/[\w-]+/, { timeout: 30_000 });
    await expect(page.getByTestId('order-status')).toContainText('PAID');
  });

  test('E2E-T02: MOCK_PAYMENT_MODE=failure → báo thất bại, giữ nguyên giỏ hàng', async ({
    page,
  }) => {
    await switchPaymentMode('failure');

    await addFirstProductToCart(page);

    await page.getByTestId('cart-link').click();
    await expect(page.getByTestId('cart-item')).toHaveCount(1);

    await page.getByTestId('checkout-button').click();
    await registerAndReturnToCheckout(page, uniqueEmail('e2e-failure'));

    await page.getByTestId('payment-method-wallet').click();
    await page.getByTestId('confirm-payment-button').click();

    await expect(page.getByTestId('payment-error')).toBeVisible({ timeout: 30_000 });
    await expect(page).not.toHaveURL(/\/orders\/[\w-]+/);

    // Điều hướng phía client (không reload) để kiểm tra giỏ hàng còn nguyên.
    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
  });
});
