export interface MockProduct {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  stock: number;
  description: string;
  category: 'all' | 'vietnamese' | 'espresso' | 'tea' | 'bakery' | 'coldbrew';
  badge?: string;
  isHero?: boolean;
  isBakery?: boolean;
  chips?: {
    temps?: string[];
    note?: string;
  };
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 1,
    name: 'Cà phê Đen',
    price: 29000,
    stock: 50,
    imageUrl: '/images/products/ca-phe-den.png',
    description: 'Chiết xuất từ hạt Robusta và Arabica rang đậm mộc, mang vị đắng êm sâu lắng, hậu vị thanh nhẹ và hương thơm nồng nàn nguyên bản.',
    category: 'vietnamese',
    badge: 'Đậm đà',
    chips: { temps: ['Hot', 'Iced'], note: 'Robusta mộc' },
  },
  {
    id: 2,
    name: 'Cà phê Sữa',
    price: 35000,
    stock: 50,
    imageUrl: '/images/products/ca-phe-sua.png',
    description: 'Sự kết hợp kinh điển giữa cà phê pha phin truyền thống đậm đà và sữa đặc sánh mịn. Từng giọt cà phê loang tự nhiên qua đá viên tạo nên vị ngọt béo, đắng dịu hài hòa.',
    category: 'vietnamese',
    badge: 'Truyền thống',
    chips: { temps: ['Hot', 'Iced'], note: 'Phin truyền thống' },
  },
  {
    id: 3,
    name: 'Cà phê Bạc Xỉu',
    price: 39000,
    stock: 50,
    imageUrl: '/images/products/ca-phe-bac-xiu.png',
    description: 'Dòng sữa tươi thanh béo quyện cùng chút sữa đặc ngọt dịu, điểm xuyết một lớp cà phê phin thơm nhẹ trên bề mặt, mang hương vị dịu êm, ngậy béo và dễ uống.',
    category: 'vietnamese',
    badge: 'Béo ngậy',
    chips: { temps: ['Hot', 'Iced'], note: 'Dịu ngọt êm ái' },
  },
  {
    id: 4,
    name: 'Cà phê Muối',
    price: 42000,
    originalPrice: 48000,
    stock: 50,
    imageUrl: '/images/products/ca-phe-muoi.png',
    description: 'Nền cà phê sữa đá đậm vị hòa quyện cùng lớp kem bọt muối biển sánh mịn, béo mặn bồng bềnh bên trên, rắc nhẹ bột cacao nguyên chất tạo điểm nhấn tròn vị.',
    category: 'vietnamese',
    badge: 'Bán chạy nhất',
    isHero: true,
    chips: { temps: ['Iced'], note: 'Kem muối biển' },
  },
  {
    id: 5,
    name: 'Iced Caramel Macchiato',
    price: 49000,
    stock: 45,
    imageUrl: '/images/products/iced-caramel-macchiato.png',
    description: 'Cà phê espresso phân tầng tinh tế cùng sữa tươi mát lạnh và siro vani ngọt dịu, phủ lớp bọt sữa dày mịn đan xen những đường sốt caramel vàng óng thơm ngậy.',
    category: 'espresso',
    badge: 'Signature',
    chips: { temps: ['Hot', 'Iced'], note: 'Caramel vàng óng' },
  },
  {
    id: 6,
    name: 'Matcha Latte Uji',
    price: 49000,
    stock: 40,
    imageUrl: '/images/products/matcha-latte.png',
    description: 'Bột trà xanh Uji cao cấp từ Nhật Bản được đánh bọt mịn màng, hòa cùng dòng sữa tươi béo nhẹ. Thức uống mang sắc xanh ngọc bích, vị chát thanh dịu và hậu ngọt êm ái.',
    category: 'tea',
    badge: 'Uji Kyoto',
    chips: { temps: ['Hot', 'Iced'], note: '100% Ceremonial' },
  },
  {
    id: 7,
    name: 'Trà Đào Cam Sả',
    price: 45000,
    stock: 35,
    imageUrl: '/images/products/tra-dao-cam-sa.png',
    description: 'Nền trà đen ủ lạnh ngát hương sả tươi tự nhiên, kết hợp cùng vị chua ngọt sảng khoái của tép cam vàng tươi và miếng đào giòn mọng, giúp thanh nhiệt tức thì.',
    category: 'tea',
    badge: 'Thanh nhiệt',
    chips: { temps: ['Iced'], note: 'Cam vàng & Đào tươi' },
  },
  {
    id: 8,
    name: 'Bánh Pain au Chocolat',
    price: 39000,
    stock: 25,
    imageUrl: '/images/products/pain-au-chocolat.png',
    description: 'Lớp vỏ bánh ngàn lớp xốp giòn ôm trọn hai thanh sô-cô-la đen đậm vị tan chảy ở giữa. Sự kết hợp hoàn hảo giữa độ giòn béo của bơ và vị đắng ngọt tinh tế.',
    category: 'bakery',
    badge: 'Bơ Pháp & Socola',
    isBakery: true,
    chips: { note: '🔥 Nướng thơm giòn' },
  },
  {
    id: 9,
    name: 'Basque Burnt Cheesecake',
    price: 45000,
    stock: 20,
    imageUrl: '/images/products/basque-burnt-cheesecake.png',
    description: 'Bánh phô mai nướng cháy xém bề mặt theo phong cách xứ Basque, đượm hương caramel nướng đặc trưng. Cốt bánh mềm ngậy, mịn tan và có hậu chua thanh nhẹ từ kem phô mai.',
    category: 'bakery',
    badge: 'Xứ Basque',
    isBakery: true,
    chips: { note: '✨ Phô mai nướng cháy' },
  },
  {
    id: 10,
    name: 'Classic Tiramisu',
    price: 49000,
    stock: 0,
    imageUrl: '/images/products/classic-tiramisu.png',
    description: 'Cốt bánh ladyfinger mềm mại thấm đẫm cà phê espresso đậm đặc, xen kẽ các lớp kem phô mai mascarpone béo mịn và phủ bề mặt bằng lớp bột cacao thơm bùi, đắng nhẹ.',
    category: 'bakery',
    badge: 'Ý truyền thống',
    isBakery: true,
    chips: { note: '☕ Thấm đẫm Espresso' },
  },
];
