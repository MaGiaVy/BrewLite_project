'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiClient,
  AUTH_STORAGE_KEY,
  type AuthSession,
} from '../../lib/api-client';
import styles from '../../components/admin/admin.module.css';
import { AdminBottomBar, type AdminTabKey } from '../../components/admin/AdminBottomBar';
import { AdminOverviewSection } from '../../components/admin/AdminOverviewSection';
import { AdminMenuSection, type ProductItem } from '../../components/admin/AdminMenuSection';
import { AdminInventorySection, type IngredientItem } from '../../components/admin/AdminInventorySection';
import {
  AdminManagementSection,
  type StaffUserItem,
  type CustomerUserItem,
  type VoucherItem,
} from '../../components/admin/AdminManagementSection';
import { AdminBottomSheet } from '../../components/admin/AdminBottomSheet';
import { BellIcon } from '../../components/admin/AdminIcons';

// Default initial data for resilient offline / local dev
const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 1,
    name: 'Phin Sữa Đá Highlands',
    description: 'Cà phê rang đậm truyền thống pha phin, sữa đặc ngọt dịu',
    basePrice: 35000,
    category: 'vietnamese',
    isActive: true,
    availableServings: 60,
  },
  {
    id: 2,
    name: 'Trà Sen Vàng Hạt Sen',
    description: 'Trà ô long thanh mát kết hợp hạt sen bùi béo và kem macchiato',
    basePrice: 49000,
    category: 'tea',
    isActive: true,
    availableServings: 35,
  },
  {
    id: 3,
    name: 'Freeze Cà Phê Thạch',
    description: 'Cà phê xay đá cùng thạch caramel dai giòn sảng khoái',
    basePrice: 55000,
    category: 'espresso',
    isActive: true,
    availableServings: 20,
  },
  {
    id: 4,
    name: 'Bánh Croissant Bơ Tươi',
    description: 'Bánh sừng bò nướng giòn tan béo thơm bơ Pháp',
    basePrice: 32000,
    category: 'bakery',
    isActive: true,
    availableServings: 15,
  },
];

const INITIAL_INGREDIENTS: IngredientItem[] = [
  {
    id: 1,
    code: 'ROBUSTA-BMT',
    name: 'Hạt Robusta Buôn Ma Thuột',
    unit: 'kg',
    stock: 1.8,
    minThreshold: 3.0,
    status: 'LOW_STOCK',
    percentage: 35,
  },
  {
    id: 2,
    code: 'MILK-BARISTA',
    name: 'Sữa tươi thanh trùng Barista',
    unit: 'hộp',
    stock: 4,
    minThreshold: 10,
    status: 'LOW_STOCK',
    percentage: 40,
  },
  {
    id: 3,
    code: 'LOTUS-SEED',
    name: 'Hạt Sen Nấu Đường Phèn',
    unit: 'kg',
    stock: 6.5,
    minThreshold: 2.0,
    status: 'OK',
    percentage: 85,
  },
  {
    id: 4,
    code: 'CONDENSED-MILK',
    name: 'Sữa đặc có đường hảo hạng',
    unit: 'lon',
    stock: 18,
    minThreshold: 5,
    status: 'OK',
    percentage: 90,
  },
];

const INITIAL_STAFF: StaffUserItem[] = [
  {
    id: 101,
    fullName: 'Nguyễn Gia Thành',
    email: 'thanh.barista@brewlite.vn',
    role: 'STAFF',
    isActive: true,
  },
  {
    id: 102,
    fullName: 'Huỳnh Tuấn Kiệt',
    email: 'kiet.cashier@brewlite.vn',
    role: 'STAFF',
    isActive: true,
  },
];

const INITIAL_CUSTOMERS: CustomerUserItem[] = [
  {
    id: 201,
    fullName: 'Trần Văn Minh',
    email: 'minh.customer@gmail.com',
    points: 120,
  },
  {
    id: 202,
    fullName: 'Lê Thị Thu Thảo',
    email: 'thao.le@gmail.com',
    points: 350,
  },
];

const INITIAL_VOUCHERS: VoucherItem[] = [
  {
    id: 1,
    code: 'BREW10',
    description: 'Giảm 10% tối đa 15.000đ cho đơn từ 40k',
    discountPercent: 10,
    isActive: true,
  },
  {
    id: 2,
    code: 'WELCOME20',
    description: 'Giảm 20% cho khách hàng mới gia nhập',
    discountPercent: 20,
    isActive: true,
  },
];

export default function AdminPortalPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');

  // Core data states
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [ingredients, setIngredients] = useState<IngredientItem[]>(INITIAL_INGREDIENTS);
  const [staffList, setStaffList] = useState<StaffUserItem[]>(INITIAL_STAFF);
  const [customerList, setCustomerList] = useState<CustomerUserItem[]>(INITIAL_CUSTOMERS);
  const [voucherList, setVoucherList] = useState<VoucherItem[]>(INITIAL_VOUCHERS);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: number; status: string; totalAmount: number; createdAt: string; itemsSummary?: string }>>([]);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Bottom Sheet Modal
  const [activeSheet, setActiveSheet] = useState<'product' | 'inventory' | 'staff' | 'voucher' | null>(null);
  const [sheetName, setSheetName] = useState('');
  const [sheetPrice, setSheetPrice] = useState('39000');
  const [sheetCategory, setSheetCategory] = useState('vietnamese');
  const [sheetStockAmount, setSheetStockAmount] = useState('5');
  const [selectedIngredientId, setSelectedIngredientId] = useState<number>(1);
  const [sheetStaffEmail, setSheetStaffEmail] = useState('');
  const [sheetStaffName, setSheetStaffName] = useState('');

  // 1. Role Guard: Only ADMIN
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        router.replace('/login?redirect=%2Fadmin');
        setAuthorized(false);
        return;
      }
      const parsed = JSON.parse(raw) as { state?: AuthSession } & AuthSession;
      const user = parsed?.state?.user ?? parsed?.user;
      if (user?.role === 'ADMIN') {
        setAuthorized(true);
      } else {
        router.replace('/login?redirect=%2Fadmin');
        setAuthorized(false);
      }
    } catch {
      router.replace('/login?redirect=%2Fadmin');
      setAuthorized(false);
    }
  }, [router]);

  // 2. Fetch live data from backend APIs with fallback
  useEffect(() => {
    if (!authorized) return;

    const fetchAllData = async () => {
      try {
        const [pRes, iRes, oRes, uRes] = await Promise.all([
          apiClient('/products', { cache: 'no-store' }),
          apiClient('/inventory/ingredients', { cache: 'no-store' }),
          apiClient('/orders', { cache: 'no-store' }),
          apiClient('/users', { cache: 'no-store' }),
        ]);

        if (pRes.ok) {
          const pData = await pRes.json();
          const list = Array.isArray(pData) ? pData : pData?.data ?? [];
          if (list.length > 0) setProducts(list);
        }

        if (iRes.ok) {
          const iData = await iRes.json();
          const list = Array.isArray(iData) ? iData : iData?.data ?? [];
          if (list.length > 0) setIngredients(list);
        }

        if (oRes.ok) {
          const oData = await oRes.json();
          const list = Array.isArray(oData) ? oData : oData?.data ?? [];
          if (list.length > 0) {
            setRecentOrders(
              list.map((o: any) => ({
                id: o.id,
                status: o.status,
                totalAmount: o.finalTotal || o.totalAmount || 0,
                createdAt: o.createdAt,
                itemsSummary: o.items?.map((it: any) => `${it.quantity}x ${it.productName || it.product?.name}`).join(', '),
              })),
            );
          }
        }

        if (uRes.ok) {
          const uData = await uRes.json();
          const list = Array.isArray(uData) ? uData : uData?.data ?? [];
          if (list.length > 0) setStaffList(list.filter((u: any) => u.role === 'STAFF'));
        }
      } catch {
        // Keep resilient initial data
      }
    };

    fetchAllData();
  }, [authorized]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // Toggle Product Selling status
  const handleToggleProduct = async (id: number, currentActive: boolean) => {
    const next = !currentActive;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isActive: next, isSoldOutManual: !next } : p,
      ),
    );

    try {
      await apiClient(`/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      });
    } catch {
      // Optimistic update maintained
    }

    showToast(next ? 'Đã mở bán lại món' : 'Đã tạm ngưng bán món');
  };

  // Quick Stock In
  const handleQuickStockIn = async (ingId: number, amount: number) => {
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === ingId
          ? {
              ...i,
              stock: Math.round((i.stock + amount) * 10) / 10,
              status: i.stock + amount >= i.minThreshold ? 'OK' : 'LOW_STOCK',
            }
          : i,
      ),
    );

    try {
      await apiClient('/inventory/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientId: ingId, amount }),
      });
    } catch {
      // Optimistic update
    }

    showToast(`Đã nhập thêm +${amount} vào kho`);
  };

  // Toggle Staff status
  const handleToggleStaff = async (staffId: number, currentActive: boolean) => {
    const next = !currentActive;
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, isActive: next } : s)),
    );
    showToast(next ? 'Đã kích hoạt tài khoản nhân viên' : 'Đã khóa tài khoản nhân viên');
  };

  // Check low stock count
  const lowStockCount = useMemo(() => {
    return ingredients.filter(
      (i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK' || i.stock <= i.minThreshold,
    ).length;
  }, [ingredients]);

  if (authorized === null) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.mobileShell} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p className="text-xs text-[#a89587]">Đang kiểm tra quyền quản trị...</p>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mobileShell}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.brandWrap}>
            <div className={styles.logoBadge}>BL</div>
            <div>
              <p className={styles.brandTitle}>BREWLITE PREMIER</p>
              <h1 className={styles.storeSubtitle}>
                Quản lý Cửa hàng <span className={styles.openBadge}>● Mở ca</span>
              </h1>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => showToast(`Có ${lowStockCount} nguyên liệu sắp hết`)}
              aria-label="Thông báo kho"
            >
              <BellIcon size={18} />
              {lowStockCount > 0 && <span className={styles.badgeDot} />}
            </button>
            <div className={styles.userAvatar}>ADMIN</div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className={styles.scrollArea}>
          {activeTab === 'overview' && (
            <AdminOverviewSection
              revenueToday={18450000}
              ordersCount={142}
              lowStockItemsCount={lowStockCount}
              recentOrders={recentOrders}
              onNavigateInventory={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'menu' && (
            <AdminMenuSection
              products={products}
              onToggleStatus={handleToggleProduct}
              onOpenCreateModal={() => {
                setSheetName('');
                setSheetPrice('39000');
                setActiveSheet('product');
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <AdminInventorySection
              ingredients={ingredients}
              onQuickStockIn={handleQuickStockIn}
              onOpenAddModal={() => {
                setSheetStockAmount('5');
                setActiveSheet('inventory');
              }}
            />
          )}

          {activeTab === 'management' && (
            <AdminManagementSection
              staffList={staffList}
              customerList={customerList}
              voucherList={voucherList}
              onToggleStaffStatus={handleToggleStaff}
              onToggleVoucherStatus={(id, cur) => {
                setVoucherList((prev) =>
                  prev.map((v) => (v.id === id ? { ...v, isActive: !cur } : v)),
                );
                showToast(!cur ? 'Đã bật mã voucher' : 'Đã tắt mã voucher');
              }}
              onOpenCreateStaff={() => {
                setSheetStaffName('');
                setSheetStaffEmail('');
                setActiveSheet('staff');
              }}
              onOpenCreateVoucher={() => {
                setActiveSheet('voucher');
              }}
            />
          )}
        </main>

        {/* Fixed Bottom Tab Bar */}
        <AdminBottomBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasLowStock={lowStockCount > 0}
        />

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className={styles.toast} role="status" aria-live="polite">
            <span>{toastMsg}</span>
            <span className="text-xs text-[#d4af37] font-mono">OK</span>
          </div>
        )}

        {/* Bottom Sheet for Product Creation */}
        <AdminBottomSheet
          isOpen={activeSheet === 'product'}
          onClose={() => setActiveSheet(null)}
          title="Thêm món mới vào thực đơn"
          submitLabel="Lưu món vào Menu"
          onSubmit={() => {
            if (!sheetName.trim()) {
              showToast('Vui lòng nhập tên món!');
              return;
            }
            const newProd: ProductItem = {
              id: Date.now(),
              name: sheetName.trim(),
              basePrice: parseInt(sheetPrice, 10) || 35000,
              description: 'Món mới pha chế thủ công',
              category: sheetCategory,
              isActive: true,
              availableServings: 50,
            };
            setProducts((prev) => [newProd, ...prev]);
            setActiveSheet(null);
            showToast(`Đã thêm món "${newProd.name}" thành công!`);
          }}
        >
          <div className="space-y-3">
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Tên món đồ uống / bánh</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Ví dụ: Cà Phê Trứng Béo Ngậy"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Giá bán niêm yết (VNĐ)</label>
              <input
                type="number"
                className={styles.textInput}
                placeholder="39000"
                value={sheetPrice}
                onChange={(e) => setSheetPrice(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Danh mục món</label>
              <select
                className={styles.textInput}
                value={sheetCategory}
                onChange={(e) => setSheetCategory(e.target.value)}
              >
                <option value="vietnamese">Cà Phê Phin Việt Nam</option>
                <option value="espresso">Signature Espresso</option>
                <option value="tea">Trà & Matcha</option>
                <option value="bakery">Bánh Ngọt</option>
              </select>
            </div>
          </div>
        </AdminBottomSheet>

        {/* Bottom Sheet for Stock In */}
        <AdminBottomSheet
          isOpen={activeSheet === 'inventory'}
          onClose={() => setActiveSheet(null)}
          title="Nhập thêm nguyên liệu vào kho"
          submitLabel="Xác nhận nhập kho"
          onSubmit={() => {
            const amount = parseFloat(sheetStockAmount) || 5;
            handleQuickStockIn(selectedIngredientId, amount);
            setActiveSheet(null);
          }}
        >
          <div className="space-y-3">
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Chọn nguyên liệu</label>
              <select
                className={styles.textInput}
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(parseInt(e.target.value, 10))}
              >
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.stock} {ing.unit} hiện có)
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Số lượng nhập thêm</label>
              <input
                type="number"
                step="0.5"
                className={styles.textInput}
                value={sheetStockAmount}
                onChange={(e) => setSheetStockAmount(e.target.value)}
              />
            </div>
          </div>
        </AdminBottomSheet>
      </div>
    </div>
  );
}
