export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

/**
 * Lấy chữ viết tắt đại diện cho avatar từ họ tên tiếng Việt
 * Tự động loại bỏ các tag hậu tố như (Admin), (Staff), (VIP)...
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'BL';
  // Loại bỏ nội dung trong ngoặc đơn như (Admin), (Staff) và các ký tự đặc biệt
  const clean = name.replace(/\(.*?\)/g, '').replace(/[^\p{L}\s]/gu, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'BL';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const first = words[0][0];
  const last = words[words.length - 1][0];
  return (first + last).toUpperCase();
}
