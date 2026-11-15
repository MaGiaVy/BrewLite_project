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

function isBakeryProduct(item: ProductItem): boolean {
  if (item.category === 'bakery') return true;
  const lower = item.name.toLowerCase();
  return (
    lower.includes('bánh') ||
    lower.includes('pain') ||
    lower.includes('croissant') ||
    lower.includes('cruffin') ||
    lower.includes('cheesecake') ||
    lower.includes('tiramisu')
  );
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
    <div className={styles.sectionStack}>
      {/* Header & Add Button */}
      <div className={styles.sectionHeaderRow}>
        <div>
          <h2 className={styles.sectionTitle}>
            Thực đơn món ({products.length})
          </h2>
          <p className={styles.sectionSubtitle}>
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
      <div className={styles.searchWrap}>
        <input
          type="text"
          placeholder="Tìm tên món ăn, đồ uống..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${styles.textInput} ${styles.searchInput}`}
        />
        <div className={styles.searchIconWrap}>
          <SearchIcon size={18} />
        </div>
      </div>

      {/* Category Pills */}
      <div className={styles.categoryPillsRow}>
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
            className={`${styles.secondaryBtn} ${styles.categoryPill} ${
              selectedCategory === cat.id ? styles.categoryPillActive : ''
            }`.trim()}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Cards Stack (Mobile-First) */}
      <div className={styles.stackSm}>
        {filtered.length === 0 ? (
          <div className={`${styles.card} ${styles.emptyCard}`}>
            Không tìm thấy món ăn nào phù hợp
          </div>
        ) : (
          filtered.map((item) => {
            const isSelling = item.isActive !== false && !item.isSoldOutManual;
            const unitLabel = isBakeryProduct(item) ? 'phần' : 'ly';

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

                <div className={styles.itemFooterRow}>
                  <span className={isSelling ? styles.statusSelling : styles.statusPaused}>
                    {isSelling ? '● Đang mở bán' : '○ Tạm ngưng bán'}
                  </span>
                  <span className={styles.stockEstimate}>
                    Ước tính tồn: ~{item.availableServings ?? 0} {unitLabel}
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
