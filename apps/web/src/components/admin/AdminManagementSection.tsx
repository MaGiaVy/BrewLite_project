import React, { useState } from 'react';
import styles from './admin.module.css';
import { PlusIcon } from './AdminIcons';

export interface StaffUserItem {
  id: number;
  fullName: string | null;
  email: string;
  phone?: string | null;
  position?: string | null;
  role: string;
  isActive?: boolean;
}

export interface CustomerUserItem {
  id: number;
  fullName: string | null;
  email: string;
  phone?: string | null;
  loyaltyPoints?: number;
  points?: number;
  isActive?: boolean;
  ordersCount?: number;
  _count?: { orders: number };
}

export interface VoucherItem {
  id: number;
  code: string;
  description: string;
  discountPercent: number;
  isActive: boolean;
}

interface AdminManagementSectionProps {
  staffList: StaffUserItem[];
  customerList: CustomerUserItem[];
  voucherList: VoucherItem[];
  onToggleStaffStatus: (staffId: number, currentActive: boolean) => void;
  onToggleCustomerStatus?: (customerId: number, currentActive: boolean) => void;
  onToggleVoucherStatus: (voucherId: number, currentActive: boolean) => void;
  onOpenCreateStaff: () => void;
  onOpenCreateVoucher: () => void;
}

export function AdminManagementSection({
  staffList,
  customerList,
  voucherList,
  onToggleStaffStatus,
  onToggleCustomerStatus,
  onToggleVoucherStatus,
  onOpenCreateStaff,
  onOpenCreateVoucher,
}: AdminManagementSectionProps) {
  const [subTab, setSubTab] = useState<'staff' | 'customers' | 'vouchers'>('staff');

  return (
    <div className="space-y-3.5">
      {/* Sub Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-[#FAF6F0] border border-[#EBE3D5]">
        <button
          type="button"
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
          style={{
            backgroundColor: subTab === 'staff' ? '#1C1917' : 'transparent',
            color: subTab === 'staff' ? '#FFFFFF' : '#78716C',
          }}
          onClick={() => setSubTab('staff')}
          data-testid="subtab-staff"
        >
          Nhân sự ({staffList.length})
        </button>
        <button
          type="button"
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
          style={{
            backgroundColor: subTab === 'customers' ? '#1C1917' : 'transparent',
            color: subTab === 'customers' ? '#FFFFFF' : '#78716C',
          }}
          onClick={() => setSubTab('customers')}
          data-testid="subtab-customers"
        >
          Khách hàng ({customerList.length})
        </button>
        <button
          type="button"
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
          style={{
            backgroundColor: subTab === 'vouchers' ? '#1C1917' : 'transparent',
            color: subTab === 'vouchers' ? '#FFFFFF' : '#78716C',
          }}
          onClick={() => setSubTab('vouchers')}
          data-testid="subtab-vouchers"
        >
          Voucher ({voucherList.length})
        </button>
      </div>

      {/* Sub Tab: Staff */}
      {subTab === 'staff' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-[#78716C]">
              Đội ngũ Barista & Thu ngân
            </span>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onOpenCreateStaff}
              data-testid="add-staff-btn"
            >
              <PlusIcon size={16} />
              <span>Thêm nhân viên</span>
            </button>
          </div>

          {staffList.length === 0 ? (
            <div className={`${styles.card} text-center py-6 text-xs text-[#78716C]`}>
              Chưa có nhân viên nào
            </div>
          ) : (
            staffList.map((st) => {
              const active = st.isActive !== false;
              return (
                <div key={st.id} className={styles.itemCard} data-testid={`staff-card-${st.id}`}>
                  <div className={styles.itemHeaderRow}>
                    <div>
                      <h3 className={styles.itemName}>
                        {st.fullName || 'Nhân viên #' + st.id}
                      </h3>
                      <span className={styles.itemSubtext}>
                        {st.email} • {st.position || st.role}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`${styles.toggleSwitch} ${active ? styles.toggleSwitchActive : ''}`}
                      onClick={() => onToggleStaffStatus(st.id, active)}
                      aria-label={`Bật tắt hoạt động nhân viên ${st.fullName || st.email}`}
                      data-testid={`toggle-staff-${st.id}`}
                    >
                      <div
                        className={`${styles.toggleKnob} ${active ? styles.toggleKnobActive : ''}`}
                      />
                    </button>
                  </div>
                  <div className="pt-2 border-t border-[#EBE3D5] text-[10px]">
                    <span className={active ? 'text-[#059669] font-bold' : 'text-[#DC2626] font-bold'}>
                      {active ? '● Đang làm việc' : '○ Đã khóa tài khoản'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sub Tab: Customers */}
      {subTab === 'customers' && (
        <div className="space-y-2.5">
          {customerList.length === 0 ? (
            <div className={`${styles.card} text-center py-6 text-xs text-[#78716C]`}>
              Chưa có khách hàng nào
            </div>
          ) : (
            customerList.map((c) => {
              const points = c.loyaltyPoints ?? c.points ?? 0;
              const orderTotal = c._count?.orders ?? c.ordersCount ?? 0;
              const active = c.isActive !== false;
              return (
                <div key={c.id} className={styles.itemCard} data-testid={`customer-card-${c.id}`}>
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className={styles.itemName}>
                        {c.fullName || c.email.split('@')[0]}
                      </h3>
                      <span className={styles.itemSubtext}>
                        {c.email} • {orderTotal} đơn
                      </span>
                      <div className="text-xs font-bold text-[#9C6644] mt-1">
                        {points} hạt vàng
                      </div>
                    </div>
                    {onToggleCustomerStatus && (
                      <button
                        type="button"
                        className={`${styles.toggleSwitch} ${active ? styles.toggleSwitchActive : ''}`}
                        onClick={() => onToggleCustomerStatus(c.id, active)}
                        aria-label={`Bật tắt tài khoản khách hàng ${c.fullName || c.email}`}
                        data-testid={`toggle-customer-${c.id}`}
                      >
                        <div
                          className={`${styles.toggleKnob} ${active ? styles.toggleKnobActive : ''}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sub Tab: Vouchers */}
      {subTab === 'vouchers' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-[#78716C]">
              Mã khuyến mãi & Giảm giá
            </span>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onOpenCreateVoucher}
              data-testid="add-voucher-btn"
            >
              <PlusIcon size={16} />
              <span>Tạo Voucher</span>
            </button>
          </div>

          {voucherList.length === 0 ? (
            <div className={`${styles.card} text-center py-6 text-xs text-[#78716C]`}>
              Chưa có mã voucher nào
            </div>
          ) : (
            voucherList.map((v) => (
              <div key={v.id} className={styles.itemCard} data-testid={`voucher-card-${v.id}`}>
                <div className={styles.itemHeaderRow}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#1C1917] text-white">
                        {v.code}
                      </span>
                      <span className="text-xs font-bold text-[#9C6644]">
                        Giảm {v.discountPercent}%
                      </span>
                    </div>
                    <p className={styles.itemSubtext}>{v.description}</p>
                  </div>

                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${v.isActive ? styles.toggleSwitchActive : ''}`}
                    onClick={() => onToggleVoucherStatus(v.id, v.isActive)}
                    aria-label={`Bật tắt mã voucher ${v.code}`}
                    data-testid={`toggle-voucher-${v.id}`}
                  >
                    <div
                      className={`${styles.toggleKnob} ${v.isActive ? styles.toggleKnobActive : ''}`}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
