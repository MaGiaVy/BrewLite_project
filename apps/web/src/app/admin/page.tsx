'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  completedCount: number;
  activeCount: number;
  totalGrossProfit: number;
}

interface RecentOrderRow {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  itemsSummary?: string;
}

const EMPTY_DASHBOARD: DashboardStats = {
  totalRevenue: 0,
  totalOrders: 0,
  completedCount: 0,
  activeCount: 0,
  totalGrossProfit: 0,
};

function readStoredUser(): AuthSession['user'] {
  if (typeof window === 'undefined') return null;
  const keys = Array.from(
    new Set([AUTH_STORAGE_KEY, 'brewlite-auth-storage', 'brewlite-auth']),
  );
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as { state?: AuthSession } & AuthSession;
      const candidate = parsed?.state?.user ?? parsed?.user ?? null;
      if (candidate) return candidate;
    } catch {
      // ignore malformed storage value and continue to fallback key
    }
  }
  return null;
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  } catch {
    // non-JSON response body
  }
  return `${fallback} (HTTP ${res.status})`;
}

export default function AdminPortalPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');

  // Core data states — strictly initialized empty, populated from live APIs
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [staffList, setStaffList] = useState<StaffUserItem[]>([]);
  const [customerList, setCustomerList] = useState<CustomerUserItem[]>([]);
  const [voucherList, setVoucherList] = useState<VoucherItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(EMPTY_DASHBOARD);

  // Toast
  const [toast, setToast] = useState<{ msg: string; kind: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bottom Sheet Modal states
  const [activeSheet, setActiveSheet] = useState<'product' | 'inventory' | 'staff' | 'voucher' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product sheet fields
  const [sheetName, setSheetName] = useState('');
  const [sheetPrice, setSheetPrice] = useState('39000');
  const [sheetCategory, setSheetCategory] = useState('vietnamese');
  const [sheetDescription, setSheetDescription] = useState('');

  // Inventory restock sheet fields
  const [sheetStockAmount, setSheetStockAmount] = useState('5');
  const [selectedIngredientId, setSelectedIngredientId] = useState<number>(0);

  // Staff sheet fields
  const [sheetStaffName, setSheetStaffName] = useState('');
  const [sheetStaffEmail, setSheetStaffEmail] = useState('');
  const [sheetStaffPassword, setSheetStaffPassword] = useState('');
  const [sheetStaffPhone, setSheetStaffPhone] = useState('');
  const [sheetStaffPosition, setSheetStaffPosition] = useState('');

  // Voucher sheet fields
  const [sheetVoucherCode, setSheetVoucherCode] = useState('');
  const [sheetVoucherPercent, setSheetVoucherPercent] = useState('10');
  const [sheetVoucherDesc, setSheetVoucherDesc] = useState('');
  const [sheetVoucherMinOrder, setSheetVoucherMinOrder] = useState('0');
  const [sheetVoucherMaxDiscount, setSheetVoucherMaxDiscount] = useState('');

  const showToast = (msg: string, kind: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ msg, kind });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // 1. Role Guard: Only ADMIN
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const user = readStoredUser();
    if (user?.role === 'ADMIN') {
      setAuthorized(true);
    } else {
      router.replace('/login?redirect=%2Fadmin');
      setAuthorized(false);
    }
  }, [router]);

  // 2. Fetch live data from backend APIs
  useEffect(() => {
    if (!authorized) return;
    let active = true;

    const fetchAllData = async () => {
      let hasFailure = false;
      try {
        const [pRes, iRes, oRes, sRes, cRes, dRes, vRes] = await Promise.all([
          apiClient('/products?includeInactive=true', { cache: 'no-store' }),
          apiClient('/inventory/ingredients', { cache: 'no-store' }),
          apiClient('/orders', { cache: 'no-store' }),
          apiClient('/staff', { cache: 'no-store' }),
          apiClient('/admin/customers', { cache: 'no-store' }),
          apiClient('/inventory/dashboard', { cache: 'no-store' }),
          apiClient('/inventory/vouchers', { cache: 'no-store' }),
        ]);

        if (!active) return;

        if (pRes.ok) {
          const pData = await pRes.json();
          const list = Array.isArray(pData) ? pData : pData?.data ?? [];
          setProducts(list);
        } else {
          hasFailure = true;
        }

        if (iRes.ok) {
          const iData = await iRes.json();
          const list = Array.isArray(iData) ? iData : iData?.data ?? [];
          setIngredients(list);
          if (list.length > 0) {
            setSelectedIngredientId((prev) =>
              list.some((item: IngredientItem) => item.id === prev) ? prev : list[0].id,
            );
          }
        } else {
          hasFailure = true;
        }

        if (oRes.ok) {
          const oData = await oRes.json();
          const list = Array.isArray(oData) ? oData : oData?.data ?? [];
          setRecentOrders(
            list.map((o: any) => ({
              id: o.id,
              status: o.status,
              totalAmount: o.finalTotal ?? o.totalAmount ?? 0,
              createdAt: o.createdAt,
              itemsSummary: o.items
                ?.map((it: any) => `${it.quantity}x ${it.productName || it.product?.name}`)
                .join(', '),
            })),
          );
        } else {
          hasFailure = true;
        }

        if (sRes.ok) {
          const sData = await sRes.json();
          const list = Array.isArray(sData) ? sData : sData?.data ?? [];
          setStaffList(list);
        } else {
          hasFailure = true;
        }

        if (cRes.ok) {
          const cData = await cRes.json();
          const list = Array.isArray(cData) ? cData : cData?.data ?? [];
          setCustomerList(list);
        } else {
          hasFailure = true;
        }

        if (dRes.ok) {
          const dData = await dRes.json();
          setDashboardStats({
            totalRevenue: Number(dData?.totalRevenue ?? 0),
            totalOrders: Number(dData?.totalOrders ?? 0),
            completedCount: Number(dData?.completedCount ?? 0),
            activeCount: Number(dData?.activeCount ?? 0),
            totalGrossProfit: Number(dData?.totalGrossProfit ?? 0),
          });
        } else {
          hasFailure = true;
        }

        if (vRes.ok) {
          const vData = await vRes.json();
          const list = Array.isArray(vData) ? vData : vData?.data ?? [];
          setVoucherList(list);
        } else {
          hasFailure = true;
        }

        if (hasFailure) {
          showToast('Không thể tải đầy đủ dữ liệu quản trị từ máy chủ', 'error');
        }
      } catch {
        if (active) {
          showToast('Không thể tải đầy đủ dữ liệu quản trị từ máy chủ', 'error');
        }
      }
    };

    fetchAllData();
    return () => {
      active = false;
    };
  }, [authorized]);

  // Toggle Product Selling status (PATCH /products/:id/visibility)
  const handleToggleProduct = async (id: number, currentActive: boolean) => {
    const next = !currentActive;
    const prevSnapshot = products;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isActive: next, isSoldOutManual: !next } : p,
      ),
    );

    try {
      const res = await apiClient(`/products/${id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next, isSoldOutManual: !next }),
      });

      if (!res.ok) {
        setProducts(prevSnapshot);
        const errMsg = await readApiError(res, 'Không thể cập nhật trạng thái món');
        showToast(errMsg, 'error');
        return;
      }

      const updated = await res.json().catch(() => null);
      if (updated && typeof updated === 'object' && updated.id) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      }
      showToast(next ? 'Đã mở bán lại món' : 'Đã tạm ngưng bán món');
    } catch {
      setProducts(prevSnapshot);
      showToast('Lỗi kết nối khi cập nhật trạng thái món', 'error');
    }
  };

  // Quick Stock In (PATCH /inventory/ingredients/:id/restock)
  const handleQuickStockIn = async (ingId: number, amount: number): Promise<boolean> => {
    if (!ingId || !Number.isFinite(amount) || amount < 0.1) {
      showToast('Số lượng nhập kho phải từ 0.1 trở lên', 'error');
      return false;
    }

    const prevSnapshot = ingredients;
    setIngredients((prev) =>
      prev.map((i) => {
        if (i.id !== ingId) return i;
        const nextStock = Math.round((i.stock + amount) * 100) / 100;
        return {
          ...i,
          stock: nextStock,
          status: nextStock <= 0 ? 'OUT_OF_STOCK' : nextStock <= i.minThreshold ? 'LOW_STOCK' : 'OK',
        };
      }),
    );

    try {
      const res = await apiClient(`/inventory/ingredients/${ingId}/restock`, {
        method: 'PATCH',
        body: JSON.stringify({ addAmount: amount }),
      });

      if (!res.ok) {
        setIngredients(prevSnapshot);
        const errMsg = await readApiError(res, 'Không thể nhập kho nguyên liệu');
        showToast(errMsg, 'error');
        return false;
      }

      const updatedIng = await res.json().catch(() => null);
      if (updatedIng && typeof updatedIng === 'object' && updatedIng.id) {
        setIngredients((prev) =>
          prev.map((i) => (i.id === ingId ? { ...i, ...updatedIng } : i)),
        );
      }
      showToast(`Đã nhập thêm +${amount} vào kho`);
      return true;
    } catch {
      setIngredients(prevSnapshot);
      showToast('Lỗi kết nối khi nhập kho nguyên liệu', 'error');
      return false;
    }
  };

  // Toggle Staff status (PATCH /staff/:id/status)
  const handleToggleStaff = async (staffId: number, currentActive: boolean) => {
    const next = !currentActive;
    const prevSnapshot = staffList;
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, isActive: next } : s)),
    );

    try {
      const res = await apiClient(`/staff/${staffId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      });

      if (!res.ok) {
        setStaffList(prevSnapshot);
        const errMsg = await readApiError(res, 'Không thể cập nhật trạng thái nhân viên');
        showToast(errMsg, 'error');
        return;
      }

      showToast(next ? 'Đã kích hoạt tài khoản nhân viên' : 'Đã khóa tài khoản nhân viên');
    } catch {
      setStaffList(prevSnapshot);
      showToast('Lỗi kết nối khi cập nhật tài khoản nhân viên', 'error');
    }
  };

  // Toggle Customer status (PATCH /admin/customers/:id/status)
  const handleToggleCustomer = async (customerId: number, currentActive: boolean) => {
    const next = !currentActive;
    const prevSnapshot = customerList;
    setCustomerList((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, isActive: next } : c)),
    );

    try {
      const res = await apiClient(`/admin/customers/${customerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      });

      if (!res.ok) {
        setCustomerList(prevSnapshot);
        const errMsg = await readApiError(res, 'Không thể cập nhật trạng thái khách hàng');
        showToast(errMsg, 'error');
        return;
      }

      showToast(next ? 'Đã mở khóa tài khoản khách hàng' : 'Đã khóa tài khoản khách hàng');
    } catch {
      setCustomerList(prevSnapshot);
      showToast('Lỗi kết nối khi cập nhật khách hàng', 'error');
    }
  };

  // Toggle Voucher status (PATCH /inventory/vouchers/:id)
  const handleToggleVoucher = async (voucherId: number, currentActive: boolean) => {
    const next = !currentActive;
    const prevSnapshot = voucherList;
    setVoucherList((prev) =>
      prev.map((v) => (v.id === voucherId ? { ...v, isActive: next } : v)),
    );

    try {
      const res = await apiClient(`/inventory/vouchers/${voucherId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      });

      if (!res.ok) {
        setVoucherList(prevSnapshot);
        const errMsg = await readApiError(res, 'Không thể cập nhật mã voucher');
        showToast(errMsg, 'error');
        return;
      }

      const updated = await res.json().catch(() => null);
      if (updated && typeof updated === 'object' && updated.id) {
        setVoucherList((prev) =>
          prev.map((v) => (v.id === voucherId ? { ...v, ...updated } : v)),
        );
      }
      showToast(next ? 'Đã bật mã voucher' : 'Đã tắt mã voucher');
    } catch {
      setVoucherList(prevSnapshot);
      showToast('Lỗi kết nối khi cập nhật mã voucher', 'error');
    }
  };

  // Submit: Create Product (POST /products)
  const handleSubmitProduct = async () => {
    const trimmedName = sheetName.trim();
    if (!trimmedName) {
      showToast('Vui lòng nhập tên món!', 'error');
      return;
    }
    const parsedPrice = Number(sheetPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showToast('Giá bán phải là số không âm!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          basePrice: parsedPrice,
          category: sheetCategory,
          ...(sheetDescription.trim() ? { description: sheetDescription.trim() } : {}),
          isActive: true,
        }),
      });

      if (!res.ok) {
        const errMsg = await readApiError(res, 'Không thể thêm món mới');
        showToast(errMsg, 'error');
        return;
      }

      const created = await res.json();
      setProducts((prev) => [created, ...prev]);
      setActiveSheet(null);
      showToast(`Đã thêm món "${created.name || trimmedName}" thành công!`);
    } catch {
      showToast('Lỗi kết nối khi thêm món mới', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit: Create Staff (POST /staff)
  const handleSubmitStaff = async () => {
    const fullName = sheetStaffName.trim();
    const email = sheetStaffEmail.trim();
    const password = sheetStaffPassword;

    if (!fullName) {
      showToast('Vui lòng nhập họ và tên nhân viên', 'error');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Email nhân viên không đúng định dạng', 'error');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Mật khẩu nhân viên phải có ít nhất 6 ký tự', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient('/staff', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          password,
          ...(sheetStaffPhone.trim() ? { phone: sheetStaffPhone.trim() } : {}),
          ...(sheetStaffPosition.trim() ? { position: sheetStaffPosition.trim() } : {}),
          role: 'STAFF',
        }),
      });

      if (!res.ok) {
        const errMsg = await readApiError(res, 'Không thể tạo tài khoản nhân viên');
        showToast(errMsg, 'error');
        return;
      }

      const created = await res.json();
      setStaffList((prev) => [...prev, created]);
      setActiveSheet(null);
      showToast(`Đã thêm nhân viên "${created.fullName || fullName}" thành công!`);
    } catch {
      showToast('Lỗi kết nối khi tạo nhân viên', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit: Create Voucher (POST /inventory/vouchers)
  const handleSubmitVoucher = async () => {
    const code = sheetVoucherCode.trim().toUpperCase().replace(/\s+/g, '');
    const discountPercent = Number(sheetVoucherPercent);
    const minOrderAmount = sheetVoucherMinOrder ? Number(sheetVoucherMinOrder) : 0;
    const maxDiscountAmount = sheetVoucherMaxDiscount ? Number(sheetVoucherMaxDiscount) : undefined;

    if (!code) {
      showToast('Vui lòng nhập mã voucher', 'error');
      return;
    }
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      showToast('Phần trăm giảm giá phải từ 1% đến 100%', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient('/inventory/vouchers', {
        method: 'POST',
        body: JSON.stringify({
          code,
          discountPercent,
          ...(sheetVoucherDesc.trim() ? { description: sheetVoucherDesc.trim() } : {}),
          minOrderAmount: Number.isFinite(minOrderAmount) && minOrderAmount >= 0 ? minOrderAmount : 0,
          ...(maxDiscountAmount !== undefined && Number.isFinite(maxDiscountAmount) && maxDiscountAmount > 0
            ? { maxDiscountAmount }
            : {}),
          isActive: true,
        }),
      });

      if (!res.ok) {
        const errMsg = await readApiError(res, 'Không thể tạo mã voucher');
        showToast(errMsg, 'error');
        return;
      }

      const created = await res.json();
      setVoucherList((prev) => [...prev, created]);
      setActiveSheet(null);
      showToast(`Đã tạo mã voucher "${created.code || code}" thành công!`);
    } catch {
      showToast('Lỗi kết nối khi tạo mã voucher', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
              revenueToday={dashboardStats.totalRevenue}
              ordersCount={dashboardStats.totalOrders}
              completedCount={dashboardStats.completedCount}
              activeCount={dashboardStats.activeCount}
              grossProfit={dashboardStats.totalGrossProfit}
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
                setSheetCategory('vietnamese');
                setSheetDescription('');
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
                if (ingredients.length > 0 && !ingredients.some((i) => i.id === selectedIngredientId)) {
                  setSelectedIngredientId(ingredients[0].id);
                }
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
              onToggleCustomerStatus={handleToggleCustomer}
              onToggleVoucherStatus={handleToggleVoucher}
              onOpenCreateStaff={() => {
                setSheetStaffName('');
                setSheetStaffEmail('');
                setSheetStaffPassword('');
                setSheetStaffPhone('');
                setSheetStaffPosition('');
                setActiveSheet('staff');
              }}
              onOpenCreateVoucher={() => {
                setSheetVoucherCode('');
                setSheetVoucherPercent('10');
                setSheetVoucherDesc('');
                setSheetVoucherMinOrder('0');
                setSheetVoucherMaxDiscount('');
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
        {toast && (
          <div
            className={styles.toast}
            style={toast.kind === 'error' ? { borderColor: '#ef4444' } : undefined}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            <span>{toast.msg}</span>
            <span
              className={`text-xs font-mono ${
                toast.kind === 'error' ? 'text-[#f87171]' : 'text-[#d4af37]'
              }`}
            >
              {toast.kind === 'error' ? 'LỖI' : 'OK'}
            </span>
          </div>
        )}

        {/* Bottom Sheet for Product Creation */}
        <AdminBottomSheet
          isOpen={activeSheet === 'product'}
          onClose={() => setActiveSheet(null)}
          title="Thêm món mới vào thực đơn"
          submitLabel="Lưu món vào Menu"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitProduct}
        >
          <div className="space-y-3">
            <div className={styles.inputGroup}>
              <label htmlFor="product-name-input" className={styles.inputLabel}>
                Tên món đồ uống / bánh
              </label>
              <input
                id="product-name-input"
                type="text"
                className={styles.textInput}
                placeholder="Ví dụ: Cà Phê Trứng Béo Ngậy"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="product-price-input" className={styles.inputLabel}>
                Giá bán niêm yết (VNĐ)
              </label>
              <input
                id="product-price-input"
                type="number"
                className={styles.textInput}
                placeholder="39000"
                value={sheetPrice}
                onChange={(e) => setSheetPrice(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="product-category-select" className={styles.inputLabel}>
                Danh mục món
              </label>
              <select
                id="product-category-select"
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
            <div className={styles.inputGroup}>
              <label htmlFor="product-desc-input" className={styles.inputLabel}>
                Mô tả món (tùy chọn)
              </label>
              <input
                id="product-desc-input"
                type="text"
                className={styles.textInput}
                placeholder="Hương vị đặc trưng..."
                value={sheetDescription}
                onChange={(e) => setSheetDescription(e.target.value)}
              />
            </div>
          </div>
        </AdminBottomSheet>

        {/* Bottom Sheet for Stock In */}
        <AdminBottomSheet
          isOpen={activeSheet === 'inventory'}
          onClose={() => setActiveSheet(null)}
          title="Nhập thêm nguyên liệu vào kho"
          submitLabel="Xác nhận nhập kho"
          isSubmitting={isSubmitting}
          onSubmit={async () => {
            const amount = parseFloat(sheetStockAmount);
            setIsSubmitting(true);
            try {
              const ok = await handleQuickStockIn(selectedIngredientId, amount);
              if (ok) setActiveSheet(null);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="space-y-3">
            <div className={styles.inputGroup}>
              <label htmlFor="restock-ingredient-select" className={styles.inputLabel}>
                Chọn nguyên liệu
              </label>
              <select
                id="restock-ingredient-select"
                className={styles.textInput}
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(parseInt(e.target.value, 10) || 0)}
              >
                {ingredients.length === 0 ? (
                  <option value={0}>Chưa có nguyên liệu</option>
                ) : (
                  ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.stock} {ing.unit} hiện có)
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="restock-amount-input" className={styles.inputLabel}>
                Số lượng nhập thêm
              </label>
              <input
                id="restock-amount-input"
                type="number"
                step="0.5"
                min="0.1"
                className={styles.textInput}
                value={sheetStockAmount}
                onChange={(e) => setSheetStockAmount(e.target.value)}
              />
            </div>
          </div>
        </AdminBottomSheet>

        {/* Bottom Sheet for Staff Creation */}
        <AdminBottomSheet
          isOpen={activeSheet === 'staff'}
          onClose={() => setActiveSheet(null)}
          title="Thêm nhân viên mới"
          submitLabel="Tạo tài khoản nhân viên"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitStaff}
        >
          <div className="space-y-3">
            <div className={styles.inputGroup}>
              <label htmlFor="staff-fullname-input" className={styles.inputLabel}>
                Họ và tên
              </label>
              <input
                id="staff-fullname-input"
                type="text"
                className={styles.textInput}
                placeholder="Nguyễn Văn An"
                value={sheetStaffName}
                onChange={(e) => setSheetStaffName(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="staff-email-input" className={styles.inputLabel}>
                Email đăng nhập
              </label>
              <input
                id="staff-email-input"
                type="email"
                className={styles.textInput}
                placeholder="nhanvien@brewlite.vn"
                value={sheetStaffEmail}
                onChange={(e) => setSheetStaffEmail(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="staff-password-input" className={styles.inputLabel}>
                Mật khẩu (ít nhất 6 ký tự)
              </label>
              <input
                id="staff-password-input"
                type="password"
                className={styles.textInput}
                placeholder="••••••"
                value={sheetStaffPassword}
                onChange={(e) => setSheetStaffPassword(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="staff-phone-input" className={styles.inputLabel}>
                Số điện thoại (tùy chọn)
              </label>
              <input
                id="staff-phone-input"
                type="tel"
                className={styles.textInput}
                placeholder="0901234567"
                value={sheetStaffPhone}
                onChange={(e) => setSheetStaffPhone(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="staff-position-input" className={styles.inputLabel}>
                Chức vụ (tùy chọn)
              </label>
              <input
                id="staff-position-input"
                type="text"
                className={styles.textInput}
                placeholder="Barista / Thu ngân"
                value={sheetStaffPosition}
                onChange={(e) => setSheetStaffPosition(e.target.value)}
              />
            </div>
          </div>
        </AdminBottomSheet>

        {/* Bottom Sheet for Voucher Creation */}
        <AdminBottomSheet
          isOpen={activeSheet === 'voucher'}
          onClose={() => setActiveSheet(null)}
          title="Tạo mã giảm giá (Voucher)"
          submitLabel="Lưu mã Voucher"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitVoucher}
        >
          <div className="space-y-3">
            <div className={styles.inputGroup}>
              <label htmlFor="voucher-code-input" className={styles.inputLabel}>
                Mã voucher
              </label>
              <input
                id="voucher-code-input"
                type="text"
                className={styles.textInput}
                placeholder="Ví dụ: BREW20"
                value={sheetVoucherCode}
                onChange={(e) => setSheetVoucherCode(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="voucher-percent-input" className={styles.inputLabel}>
                Phần trăm giảm (%)
              </label>
              <input
                id="voucher-percent-input"
                type="number"
                min="1"
                max="100"
                className={styles.textInput}
                placeholder="10"
                value={sheetVoucherPercent}
                onChange={(e) => setSheetVoucherPercent(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="voucher-desc-input" className={styles.inputLabel}>
                Mô tả ưu đãi (tùy chọn)
              </label>
              <input
                id="voucher-desc-input"
                type="text"
                className={styles.textInput}
                placeholder="Giảm 10% cho đơn hàng..."
                value={sheetVoucherDesc}
                onChange={(e) => setSheetVoucherDesc(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="voucher-min-input" className={styles.inputLabel}>
                Đơn tối thiểu (VNĐ)
              </label>
              <input
                id="voucher-min-input"
                type="number"
                min="0"
                className={styles.textInput}
                value={sheetVoucherMinOrder}
                onChange={(e) => setSheetVoucherMinOrder(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="voucher-max-input" className={styles.inputLabel}>
                Giảm tối đa (VNĐ, tùy chọn)
              </label>
              <input
                id="voucher-max-input"
                type="number"
                min="0"
                className={styles.textInput}
                placeholder="25000"
                value={sheetVoucherMaxDiscount}
                onChange={(e) => setSheetVoucherMaxDiscount(e.target.value)}
              />
            </div>
          </div>
        </AdminBottomSheet>
      </div>
    </div>
  );
}
