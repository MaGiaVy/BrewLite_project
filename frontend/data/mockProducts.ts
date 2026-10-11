export interface ProductTopping {
  id: string;
  name: string;
  price: number;
  recommended?: boolean;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  category: string;
  badge?: string;
  price: number; // Giá size S cơ sở (VNĐ)
  stock: number;
  imageUrl: string;
  description: string;
  origin?: string;
  tasteNote?: string;
  toppings: ProductTopping[];
}

export const DEFAULT_TOPPINGS: ProductTopping[] = [
  { id: 'top-1', name: 'Củ Năng Giòn', price: 10000, recommended: true },
  { id: 'top-2', name: 'Kem Cheese Béo Ngậy', price: 15000, recommended: true },
  { id: 'top-3', name: 'Trân Châu Ô Long Hoàng Kim', price: 10000 },
  { id: 'top-4', name: 'Hạt Sen Ninh Đường', price: 12000 },
  { id: 'top-5', name: 'Pudding Trứng Mịn Màng', price: 10000 },
  { id: 'top-6', name: 'Extra Shot Espresso', price: 15000 },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-cf-sda-01',
    code: 'CF-SDA-01',
    name: 'Cà Phê Sữa Đá',
    subtitle: 'Classic Iced Milk Coffee',
    category: 'COFFEE_VN',
    badge: 'TRUYỀN THỐNG',
    price: 35000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600',
    description: 'Cà phê phin đậm đà kết hợp cùng lớp sữa đặc ngọt béo truyền thống.',
    origin: 'LÂM ĐỒNG ROBUSTA',
    tasteNote: 'Chất cà phê phin truyền thống sánh đậm, hòa quyện cùng sữa đặc hảo hạng tạo nên hậu vị ngọt ngào lưu luyến.',
    toppings: DEFAULT_TOPPINGS,
  },
  {
    id: 'prod-cf-den-02',
    code: 'CF-DEN-02',
    name: 'Cà Phê Đen Đá',
    subtitle: 'Classic Black Coffee',
    category: 'COFFEE_VN',
    badge: 'ĐẬM VỊ',
    price: 29000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
    description: 'Đượm vị đắng thanh nhẹ và hương thơm nguyên bản từ hạt cà phê Rang Xay.',
    origin: 'ĐẮK LẮK MỘC',
    tasteNote: 'Hương thơm nồng nàn của hạt cà phê Robusta nguyên chất, vị đắng thanh thoát và hậu vị sảng khoái.',
    toppings: DEFAULT_TOPPINGS,
  },
  {
    id: 'prod-cf-bac-03',
    code: 'CF-BAC-03',
    name: 'Bạc Xỉu',
    subtitle: 'White Coffee Delight',
    category: 'COFFEE_VN',
    badge: 'SỮA BÉO',
    price: 35000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600',
    description: 'Sự kết hợp hoàn hảo giữa nhiều sữa tươi, chút sữa đặc và điểm xuyết hương cà phê phin.',
    origin: 'ROBUSTA MỘC & SỮA TƯƠI',
    tasteNote: 'Vị béo ngậy êm ái từ sữa tươi cao cấp, chút ngọt ngào của sữa đặc và thoảng hương thơm cà phê.',
    toppings: DEFAULT_TOPPINGS,
  },
  {
    id: 'prod-cf-slt-04',
    code: 'CF-SLT-04',
    name: 'Cà Phê Muối',
    subtitle: 'Salted Cream Coffee',
    category: 'COFFEE_VN',
    badge: 'BESTSELLER',
    price: 39000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1585495403337-12431d102e3b?w=600',
    description: 'Cà phê đắng đậm đà hòa quyện cùng lớp kem muối béo ngậy, mặn nhẹ độc đáo.',
    origin: 'FINE ROBUSTA & MUỐI BIỂN',
    tasteNote: 'Sự hòa quyện hoàn hảo giữa vị đậm đà nguyên bản và lớp kem sữa muối mặn thanh tinh tế.',
    toppings: DEFAULT_TOPPINGS,
  },
  {
    id: 'prod-es-crm-05',
    code: 'ES-CRM-05',
    name: 'Caramel Macchiato',
    subtitle: 'Vanilla Caramel Espresso',
    category: 'ESPRESSO',
    badge: 'PHA MÁY',
    price: 49000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600',
    description: 'Espresso đậm đà hòa quyện cùng sữa tươi bốc hơi nóng và xốt Caramel thơm ngọt phủ trên mặt.',
    origin: 'ARABICA CẦU ĐẤT',
    tasteNote: 'Lớp bọt sữa tươi mịn màng quyện cùng shot espresso sóng sánh và sốt caramel thơm lừng.',
    toppings: DEFAULT_TOPPINGS,
  },
  {
    id: 'prod-es-lat-06',
    code: 'ES-LAT-06',
    name: 'Cà Phê Latte',
    subtitle: 'Classic Cafe Latte',
    category: 'ESPRESSO',
    badge: 'ESPRESSO',
    price: 45000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600',
    description: 'Sự cân bằng giữa vị đắng nhẹ của Espresso và vị béo mịn của lớp bọt sữa tươi.',
    origin: 'ARABICA BLEND',
    tasteNote: 'Tỷ lệ sữa tươi đánh nóng hoàn hảo làm dịu vị đắng, mang lại cảm giác êm mượt dễ chịu.',
    toppings: DEFAULT_TOPPINGS,
  },
  {
    id: 'prod-es-ame-07',
    code: 'ES-AME-07',
    name: 'Americano',
    subtitle: 'Classic Americano',
    category: 'ESPRESSO',
    badge: 'THANH NHẸ',
    price: 39000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600',
    description: 'Cà phê Espresso pha loãng với nước tinh khiết, thơm đậm và thanh nhẹ.',
    origin: 'DOUBLE SHOT ARABICA',
    tasteNote: 'Hương thơm nguyên chất lan tỏa, vị chua thanh thoát nhẹ nhàng phù hợp uống cả ngày.',
    toppings: DEFAULT_TOPPINGS,
  },
  {
    id: 'prod-te-sen-08',
    code: 'TE-SEN-08',
    name: 'Trà Sen Vàng',
    subtitle: 'Golden Lotus Oolong Tea',
    category: 'TEA',
    badge: 'SIGNATURE',
    price: 45000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600',
    description: 'Trà Oolong thanh mát kết hợp hạt sen bùi ngậy, củ năng giòn ngọt và lớp kem béo.',
    origin: 'TRÀ OOLONG CAO NGUYÊN',
    tasteNote: 'Hương trà oolong ủ mộc thanh khiết, hạt sen ninh đường bùi dẻo cùng củ năng giòn ngọt sần sật.',
    toppings: DEFAULT_TOPPINGS,
  },
  {
    id: 'prod-te-dao-09',
    code: 'TE-DAO-09',
    name: 'Trà Đào Cam Sả',
    subtitle: 'Peach Orange Lemongrass Tea',
    category: 'TEA',
    badge: 'TRÀ MỘC',
    price: 45000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600',
    description: 'Trà đen thơm ngát vị đào mọng nước, hòa quyện cùng vị chua dịu của cam tươi và hương sả ấm.',
    origin: 'TRÀ ĐEN BẢO LỘC',
    tasteNote: 'Vị chua ngọt thanh mát giải nhiệt tức thì, hương sả ấm nồng hòa quyện tép cam tươi mọng nước.',
    toppings: DEFAULT_TOPPINGS,
  },
  {
    id: 'prod-te-ool-10',
    code: 'TE-OOL-10',
    name: 'Trà Sữa Oolong Nướng',
    subtitle: 'Roasted Oolong Milk Tea',
    category: 'TEA',
    badge: 'ĐẬM VỊ TRÀ',
    price: 49000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600',
    description: 'Đậm đà vị trà Oolong nướng thơm lừng kết hợp cùng sữa béo ngậy.',
    origin: 'OOLONG NƯỚNG ĐÀ LẠT',
    tasteNote: 'Nốt hương khói nướng đặc trưng của trà Oolong hòa tan cùng sữa béo mịn đậm đà khó cưỡng.',
    toppings: DEFAULT_TOPPINGS,
  },
];
