import { PrismaClient, DiscountType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu gieo mầm dữ liệu (Database Seeding)...');

  // 1. SEED TOPPING (6 Topping chuẩn từ Seed (1).md)
  console.log('--- Đang nạp Toppings ---');
  const toppingsData = [
    { name: 'Củ Năng Giòn', price: 10000, isAvailable: true },
    { name: 'Kem Cheese Béo Ngậy', price: 15000, isAvailable: true },
    { name: 'Trân Châu Ô Long Hoàng Kim', price: 10000, isAvailable: true },
    { name: 'Hạt Sen Ninh Đường', price: 12000, isAvailable: true },
    { name: 'Pudding Trứng Mịn Màng', price: 10000, isAvailable: true },
    { name: 'Extra Shot Espresso', price: 15000, isAvailable: true },
  ];

  for (const t of toppingsData) {
    const existing = await prisma.topping.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.topping.create({ data: t });
    }
  }

  // 2. SEED SẢN PHẨM ĐỒ UỐNG (10 Món chuẩn từ Seed (1).md)
  console.log('--- Đang nạp 10 Sản phẩm đồ uống ---');
  const productsData = [
    {
      name: 'Cà Phê Sữa Đá',
      category: 'COFFEE_VN',
      price: 35000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600',
      description: 'Cà phê phin đậm đà kết hợp cùng lớp sữa đặc ngọt béo truyền thống.',
    },
    {
      name: 'Cà Phê Đen Đá',
      category: 'COFFEE_VN',
      price: 29000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
      description: 'Đượm vị đắng thanh nhẹ và hương thơm nguyên bản từ hạt cà phê Rang Xay.',
    },
    {
      name: 'Bạc Xỉu',
      category: 'COFFEE_VN',
      price: 35000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600',
      description: 'Sự kết hợp hoàn hảo giữa nhiều sữa tươi, chút sữa đặc và điểm xuyết hương cà phê phin.',
    },
    {
      name: 'Cà Phê Muối',
      category: 'COFFEE_VN',
      price: 39000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1585495403337-12431d102e3b?w=600',
      description: 'Cà phê đắng đậm đà hòa quyện cùng lớp kem muối béo ngậy, mặn nhẹ độc đáo.',
    },
    {
      name: 'Caramel Macchiato',
      category: 'ESPRESSO',
      price: 49000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600',
      description: 'Espresso đậm đà hòa quyện cùng sữa tươi bốc hơi nóng và xốt Caramel thơm ngọt phủ trên mặt.',
    },
    {
      name: 'Cà Phê Latte',
      category: 'ESPRESSO',
      price: 45000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600',
      description: 'Sự cân bằng giữa vị đắng nhẹ của Espresso và vị béo mịn của lớp bọt sữa tươi.',
    },
    {
      name: 'Americano',
      category: 'ESPRESSO',
      price: 39000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600',
      description: 'Cà phê Espresso pha loãng với nước tinh khiết, thơm đậm và thanh nhẹ.',
    },
    {
      name: 'Trà Sen Vàng',
      category: 'TEA',
      price: 45000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600',
      description: 'Trà Oolong thanh mát kết hợp hạt sen bùi ngậy, củ năng giòn ngọt và lớp kem béo.',
    },
    {
      name: 'Trà Đào Cam Sả',
      category: 'TEA',
      price: 45000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600',
      description: 'Trà đen thơm ngát vị đào mọng nước, hòa quyện cùng vị chua dịu của cam tươi và hương sả ấm.',
    },
    {
      name: 'Trà Sữa Oolong Nướng',
      category: 'TEA',
      price: 49000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600',
      description: 'Đậm đà vị trà Oolong nướng thơm lừng kết hợp cùng sữa béo ngậy.',
    },
  ];

  for (const p of productsData) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }

  // 3. SEED VOUCHER (3 Mã giảm giá: BREWLITE10, WELCOME20, BREWCOZY)
  console.log('--- Đang nạp Vouchers ---');
  const vouchersData = [
    {
      code: 'BREWLITE10',
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      maxDiscount: 20000,
      minOrderValue: 50000,
      usageLimit: 100,
      usedCount: 0,
    },
    {
      code: 'WELCOME20',
      discountType: DiscountType.FIXED,
      discountValue: 20000,
      maxDiscount: 20000,
      minOrderValue: 40000,
      usageLimit: 50,
      usedCount: 0,
    },
    {
      code: 'BREWCOZY',
      discountType: DiscountType.PERCENT,
      discountValue: 15,
      maxDiscount: 25000,
      minOrderValue: 0,
      usageLimit: 100,
      usedCount: 0,
    },
  ];

  for (const v of vouchersData) {
    const existing = await prisma.voucher.findUnique({ where: { code: v.code } });
    if (!existing) {
      await prisma.voucher.create({ data: v });
    }
  }

  // 4. SEED TÀI KHOẢN KHÁCH HÀNG DEMO
  console.log('--- Đang nạp Tài khoản Demo ---');
  const demoEmail = 'khach@brewlite.vn';
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existingUser) {
    const hash = await bcrypt.hash('BrewLite123!', 10);
    await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash: hash,
        loyaltyPoints: 120,
      },
    });
  }

  console.log('✅ Hoàn tất Seed Database thành công 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
