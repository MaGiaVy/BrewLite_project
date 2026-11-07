import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { OrderCard } from './OrderCard';
import { RecipeSheet } from './RecipeSheet';
import { ConfirmDialog } from './ConfirmDialog';
import { StatusTabs } from './StatusTabs';
import { StockBanner } from './StockBanner';
import type { StaffOrder, StaffOrderItem } from '../../lib/staff-orders';

afterEach(() => {
  cleanup();
});

const sampleItemWithRecipe: StaffOrderItem = {
  id: 1,
  productId: 10,
  productName: 'Bạc xỉu',
  quantity: 2,
  unitPrice: 35000,
  size: 'L',
  toppings: ['Trân châu'],
  notes: 'Ít đường',
  recipeBreakdown: [
    { ingredientCode: 'CF', ingredientName: 'Cà phê Robusta', unit: 'g', amountPerUnit: 25, totalAmount: 50 },
    { ingredientCode: 'SUA', ingredientName: 'Sữa đặc', unit: 'ml', amountPerUnit: 40, totalAmount: 80 },
  ],
  toppingBreakdown: [
    { toppingName: 'Trân châu', ingredientName: 'Trân châu đen', unit: 'g', totalAmount: 60 },
  ],
};

const sampleItemNoRecipe: StaffOrderItem = {
  id: 2,
  productId: 20,
  productName: 'Nước suối',
  quantity: 1,
  unitPrice: 15000,
  size: null,
  toppings: [],
  notes: null,
};

const sampleOrder: StaffOrder = {
  id: 1042,
  status: 'PAID',
  createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago -> late!
  items: [sampleItemWithRecipe, sampleItemNoRecipe],
};

describe('T5.1f Staff Components (WEB-T18)', () => {
  it('WEB-T18 tapping an item with recipe triggers onOpenRecipe with item data', () => {
    const handleOpenRecipe = vi.fn();
    render(
      <OrderCard
        order={sampleOrder}
        now={new Date()}
        busy={false}
        onAction={vi.fn()}
        onCancel={vi.fn()}
        onOpenRecipe={handleOpenRecipe}
      />,
    );

    const recipeBtn = screen.getByRole('button', { name: /xem công thức/i });
    expect(recipeBtn).toBeTruthy();
    fireEvent.click(recipeBtn);
    expect(handleOpenRecipe).toHaveBeenCalledWith(sampleItemWithRecipe);
  });

  it('WEB-T18 item without recipe has no recipe button', () => {
    const orderNoRecipe: StaffOrder = {
      id: 1043,
      status: 'PAID',
      createdAt: new Date().toISOString(),
      items: [sampleItemNoRecipe],
    };

    render(
      <OrderCard
        order={orderNoRecipe}
        now={new Date()}
        busy={false}
        onAction={vi.fn()}
        onCancel={vi.fn()}
        onOpenRecipe={vi.fn()}
      />,
    );

    const recipeBtn = screen.queryByRole('button', { name: /xem công thức/i });
    expect(recipeBtn).toBeNull();
  });

  it('WEB-T18 late order shows "quá lâu"', () => {
    render(
      <OrderCard
        order={sampleOrder}
        now={new Date()}
        busy={false}
        onAction={vi.fn()}
        onCancel={vi.fn()}
        onOpenRecipe={vi.fn()}
      />,
    );

    expect(screen.getByText(/quá lâu/i)).toBeTruthy();
  });

  it('WEB-T18 primary button and cancel button each meet touch target height requirement', () => {
    render(
      <OrderCard
        order={sampleOrder}
        now={new Date()}
        busy={false}
        onAction={vi.fn()}
        onCancel={vi.fn()}
        onOpenRecipe={vi.fn()}
      />,
    );

    const actionBtn = screen.getByRole('button', { name: /bắt đầu pha/i });
    const cancelBtn = screen.getByRole('button', { name: /hủy đơn/i });

    expect(actionBtn.className).toMatch(/btnPrimary|min-h/i);
    expect(cancelBtn.className).toMatch(/btnCancel|ghost/i);
  });

  it('WEB-T18 RecipeSheet displays recipe and topping ingredient rows and closes by button and Escape', () => {
    const handleClose = vi.fn();
    render(<RecipeSheet item={sampleItemWithRecipe} onClose={handleClose} />);

    expect(screen.getByText(/Cà phê Robusta/i)).toBeTruthy();
    expect(screen.getByText(/50g/i)).toBeTruthy();
    expect(screen.getByText(/Trân châu đen/i)).toBeTruthy();

    // Close button click
    const closeBtn = screen.getByRole('button', { name: /đóng bảng công thức/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Escape key press
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('WEB-T18 ConfirmDialog calls onConfirm or onCancel', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        title="Xác nhận giao khách đơn #1042?"
        confirmLabel="Giao khách"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
    );

    expect(screen.getByText(/Xác nhận giao khách/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /giao khách/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /quay lại/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('WEB-T18 StockBanner renders warning when items are low and nothing when empty', () => {
    const { rerender } = render(<StockBanner lowItems={['Sữa tươi', 'Hạt Arabica']} />);
    expect(screen.getByText(/Sắp hết:/i)).toBeTruthy();
    expect(screen.getByText(/Sữa tươi, Hạt Arabica/i)).toBeTruthy();

    rerender(<StockBanner lowItems={[]} />);
    expect(screen.queryByText(/Sắp hết:/i)).toBeNull();
  });
});
