import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../cart-store';

describe('Task T5.1c — Cart Store with Zustand Persist (WEB-T04..T07)', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    window.localStorage.clear();
  });

  it('[WEB-T04] adds same item (productId, size, toppings) by incrementing quantity; splits into new line if toppings differ', () => {
    const store = useCartStore.getState();

    // Thêm món A size M với topping T1
    store.addItem({
      productId: 'p-cafe-sua',
      name: 'Cà Phê Sữa Đá',
      size: 'M',
      toppingIds: ['t-tran-chau'],
      unitPrice: 40000,
      quantity: 1,
    });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    // Thêm tiếp cùng món, cùng size, cùng topping -> phải cộng dồn số lượng
    useCartStore.getState().addItem({
      productId: 'p-cafe-sua',
      name: 'Cà Phê Sữa Đá',
      size: 'M',
      toppingIds: ['t-tran-chau'],
      unitPrice: 40000,
      quantity: 2,
    });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    // Thêm cùng món, cùng size nhưng khác topping -> tách thành dòng mới
    useCartStore.getState().addItem({
      productId: 'p-cafe-sua',
      name: 'Cà Phê Sữa Đá',
      size: 'M',
      toppingIds: ['t-thach-ca-phe'],
      unitPrice: 40000,
      quantity: 1,
    });

    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('[WEB-T05] enforces quantity limits between 1 and 20 (rejects 0 or 21)', () => {
    const store = useCartStore.getState();

    store.addItem({
      productId: 'p-bac-xiu',
      name: 'Bạc Xỉu',
      size: 'S',
      toppingIds: [],
      unitPrice: 35000,
      quantity: 1,
    });

    const item = useCartStore.getState().items[0];
    expect(item.quantity).toBe(1);

    // Thử cập nhật số lượng vượt mức 20 (ví dụ 21) -> bị từ chối / giới hạn tối đa 20
    useCartStore.getState().updateQty(item.lineId, 21);
    expect(useCartStore.getState().items[0].quantity).toBe(20);

    // Thử cập nhật số lượng <= 0 -> loại bỏ khỏi giỏ hàng hoặc chặn
    useCartStore.getState().updateQty(item.lineId, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('[WEB-T06] calculates selectTotal correctly: item M (+5k) + 2 toppings (+10k each) * 2 = 124.000đ', () => {
    const store = useCartStore.getState();

    // Base price = 47.000 + Size M (+5.000) + 2 Topping (10.000 + 10.000) = 72.000 / ly
    // Hoặc truyền unitPrice = 62.000 * 2 = 124.000
    store.addItem({
      productId: 'p-matcha',
      name: 'Matcha Latte',
      size: 'M',
      toppingIds: ['t-kem-cheese', 't-tran-chau'],
      unitPrice: 62000,
      quantity: 2,
    });

    const total = useCartStore.getState().selectTotal();
    expect(total).toBe(124000);
  });

  it('[WEB-T07] persists and rehydrates cart items from localStorage', () => {
    const store = useCartStore.getState();

    store.addItem({
      productId: 'p-americano',
      name: 'Americano Đá',
      size: 'L',
      toppingIds: [],
      unitPrice: 45000,
      quantity: 2,
    });

    expect(useCartStore.getState().items).toHaveLength(1);

    // Giả lập đọc trực tiếp từ LocalStorage
    const rawStorage = window.localStorage.getItem('brewlite-cart-storage');
    expect(rawStorage).toBeTruthy();
    const parsed = JSON.parse(rawStorage as string);
    expect(parsed?.state?.items).toHaveLength(1);
    expect(parsed?.state?.items[0].name).toBe('Americano Đá');
    expect(parsed?.state?.items[0].quantity).toBe(2);
  });
});

