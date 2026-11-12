import React, { useState } from 'react';
import styles from './admin.module.css';
import { SearchIcon, PlusIcon } from './AdminIcons';
import { formatVnd } from '../../lib/format';

export interface ProductItem {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  category?: string;
  isActive?: boolean;
  isSoldOutManual?: boolean;
  availableServings?: number;
}

interface AdminMenuSectionProps {
  products: ProductItem[];
  onToggleStatus: (productId: number, currentActive: boolean) => void;
  onOpenCreateModal: () => void;
}

export function AdminMenuSection({
  products,
  onToggleStatus,
  onOpenCreateModal,
}: AdminMenuSectionProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-3.5">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-sm font-bold text-[#fff8f0] m-0">
            Thực đơn món ({products.length})
          </h2>
          <p className="text-[11px] text-[#a89587] m-0">
            Chạm công tắc để bật / tắt bán tức thì
          </p>
        </div>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onOpenCreateModal}
          data-testid="add-product-btn"
        >
          <PlusIcon size={16} />
          <span>Thêm món</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm tên món ăn, đồ uống..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.textInput}
          style={{ width: '100%', paddingLeft: '38px' }}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89587]">
          <SearchIcon size={18} />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'vietnamese', label: 'Phin Việt Nam' },
          { id: 'espresso', label: 'Espresso' },
          { id: 'tea', label: 'Trà & Matcha' },
          { id: 'bakery', label: 'Bánh ngọt' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={styles.secondaryBtn}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              minHeight: '38px',
              backgroundColor:
                selectedCategory === cat.id ? '#991b1b' : '#231612',
              color: selectedCategory === cat.id ? '#ffffff' : '#d3bfb2',
              borderColor: selectedCategory === cat.id ? '#d4af37' : '#42261a',
            }}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Cards Stack (Mobile-First) */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className={`${styles.card} text-center py-6 text-xs text-[#a89587]`}>
            Không tìm thấy món ăn nào phù hợp
          </div>
        ) : (
          filtered.map((item) => {
            const isSelling = item.isActive !== false && !item.isSoldOutManual;

            return (
              <div key={item.id} className={styles.itemCard} data-testid={`product-card-${item.id}`}>
                <div className={styles.itemHeaderRow}>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <span className={styles.itemMeta}>
                      {formatVnd(item.basePrice)}
                    </span>
                    <span className={styles.itemSubtext}>
                      {item.description || 'Pha chế công thức nguyên bản'}
                    </span>
                  </div>

                  {/* Accessible Switch Toggle >= 48px */}
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${isSelling ? styles.toggleSwitchActive : ''}`}
                    onClick={() => onToggleStatus(item.id, isSelling)}
                    aria-label={`Bật tắt bán món ${item.name}`}
                    data-testid={`toggle-product-${item.id}`}
                  >
                    <div
                      className={`${styles.toggleKnob} ${isSelling ? styles.toggleKnobActive : ''}`}
                    />
                  </button>
                </div>

                <div className="pt-2 border-t border-[#361f15] flex justify-between items-center text-[10px]">
                  <span
                    className={
                      isSelling ? 'text-[#34d399] font-bold' : 'text-[#ef4444] font-bold'
                    }
                  >
                    {isSelling ? '● Đang mở bán' : '○ Tạm ngưng bán'}
                  </span>
                  <span className="text-[#a89587]">
                    Ước tính tồn: ~{item.availableServings ?? 0} ly
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
