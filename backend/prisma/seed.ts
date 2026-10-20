import { PrismaClient, DiscountType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu gieo mầm dữ liệu (Database Seeding)...');

  // 1. SEED NGUYÊN VẬT LIỆU (Ingredients - BOM Recipe System)
  console.log('--- Đang nạp Nguyên vật liệu kho (Ingredients) ---');
  const ingredientsData = [
    { name: 'Hạt Robusta Đắk Lắk', stock: 50000, unit: 'g' },
    { name: 'Hạt Arabica Cầu Đất', stock: 30000, unit: 'g' },
    { name: 'Sữa đặc Ngôi Sao Phương Nam', stock: 40000, unit: 'ml' },
    { name: 'Sữa tươi thanh trùng Dalatmilk', stock: 60000, unit: 'ml' },
    { name: 'Kem béo Macchiato mặn', stock: 20000, unit: 'ml' },
    { name: 'Trà Oolong nướng thượng hạng', stock: 15000, unit: 'g' },
    { name: 'Trà đen hoa trân', stock: 15000, unit: 'g' },
    { name: 'Hạt sen Huế ninh đường', stock: 20000, unit: 'g' },
    { name: 'Đào ngâm & syrup đào', stock: 25000, unit: 'ml' },
    { name: 'Xốt Caramel', stock: 15000, unit: 'ml' },
    { name: 'Ly giấy & Nắp sinh học 500ml', stock: 5000, unit: 'cái' },
    { name: 'Củ năng giòn ngâm', stock: 20000, unit: 'g' },
    { name: 'Kem Cheese tươi', stock: 20000, unit: 'ml' },
    { name: 'Trân châu Ô Long dẻo', stock: 25000, unit: 'g' },
    { name: 'Pudding trứng tươi', stock: 20000, unit: 'g' },
  ];

  const ingredientMap = new Map<string, string>();
  for (const ing of ingredientsData) {
    const record = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: { stock: ing.stock, unit: ing.unit },
      create: { name: ing.name, stock: ing.stock, unit: ing.unit, version: 0 },
    });
    ingredientMap.set(ing.name, record.id);
  }

  // 2. SEED TOPPING (6 Topping chuẩn liên kết với Nguyên liệu)
  console.log('--- Đang nạp Toppings & liên kết kho ---');
  const toppingsData = [
    { name: 'Củ Năng Giòn', price: 10000, isAvailable: true, ingredientName: 'Củ năng giòn ngâm', amountPerPortion: 30 },
    { name: 'Kem Cheese Béo Ngậy', price: 15000, isAvailable: true, ingredientName: 'Kem Cheese tươi', amountPerPortion: 40 },
    { name: 'Trân Châu Ô Long Hoàng Kim', price: 10000, isAvailable: true, ingredientName: 'Trân châu Ô Long dẻo', amountPerPortion: 35 },
    { name: 'Hạt Sen Ninh Đường', price: 12000, isAvailable: true, ingredientName: 'Hạt sen Huế ninh đường', amountPerPortion: 30 },
    { name: 'Pudding Trứng Mịn Màng', price: 10000, isAvailable: true, ingredientName: 'Pudding trứng tươi', amountPerPortion: 40 },
    { name: 'Extra Shot Espresso', price: 15000, isAvailable: true, ingredientName: 'Hạt Arabica Cầu Đất', amountPerPortion: 18 },
  ];

  for (const t of toppingsData) {
    const ingId = ingredientMap.get(t.ingredientName);
    const existing = await prisma.topping.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.topping.create({
        data: {
          name: t.name,
          price: t.price,
          isAvailable: t.isAvailable,
          ingredientId: ingId,
          amountPerPortion: t.amountPerPortion,
        },
      });
    } else {
      await prisma.topping.update({
        where: { id: existing.id },
        data: {
          price: t.price,
          isAvailable: t.isAvailable,
          ingredientId: ingId,
          amountPerPortion: t.amountPerPortion,
        },
      });
    }
  }

  // 3. SEED SẢN PHẨM ĐỒ UỐNG (10 Món chuẩn từ Seed (1).md)
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
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600',
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

  const productMap = new Map<string, string>();
  for (const p of productsData) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      const created = await prisma.product.create({ data: p });
      productMap.set(p.name, created.id);
    } else {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          imageUrl: p.imageUrl,
          price: p.price,
          description: p.description,
          category: p.category,
        },
      });
      productMap.set(p.name, updated.id);
    }
  }

  // 4. SEED CÔNG THỨC PHA CHẾ (Product Recipes - BOM)
  console.log('--- Đang nạp Công thức định lượng pha chế (BOM Recipes) ---');
  const recipesData: { productName: string; items: { ingredientName: string; amount: number }[] }[] = [
    {
      productName: 'Cà Phê Sữa Đá',
      items: [
        { ingredientName: 'Hạt Robusta Đắk Lắk', amount: 25 },
        { ingredientName: 'Sữa đặc Ngôi Sao Phương Nam', amount: 40 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
    {
      productName: 'Cà Phê Đen Đá',
      items: [
        { ingredientName: 'Hạt Robusta Đắk Lắk', amount: 25 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
    {
      productName: 'Bạc Xỉu',
      items: [
        { ingredientName: 'Hạt Robusta Đắk Lắk', amount: 15 },
        { ingredientName: 'Sữa đặc Ngôi Sao Phương Nam', amount: 30 },
        { ingredientName: 'Sữa tươi thanh trùng Dalatmilk', amount: 80 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
    {
      productName: 'Cà Phê Muối',
      items: [
        { ingredientName: 'Hạt Robusta Đắk Lắk', amount: 20 },
        { ingredientName: 'Sữa đặc Ngôi Sao Phương Nam', amount: 25 },
        { ingredientName: 'Kem béo Macchiato mặn', amount: 40 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
    {
      productName: 'Caramel Macchiato',
      items: [
        { ingredientName: 'Hạt Arabica Cầu Đất', amount: 18 },
        { ingredientName: 'Sữa tươi thanh trùng Dalatmilk', amount: 120 },
        { ingredientName: 'Xốt Caramel', amount: 20 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
    {
      productName: 'Cà Phê Latte',
      items: [
        { ingredientName: 'Hạt Arabica Cầu Đất', amount: 18 },
        { ingredientName: 'Sữa tươi thanh trùng Dalatmilk', amount: 150 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
    {
      productName: 'Americano',
      items: [
        { ingredientName: 'Hạt Arabica Cầu Đất', amount: 18 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
    {
      productName: 'Trà Sen Vàng',
      items: [
        { ingredientName: 'Trà Oolong nướng thượng hạng', amount: 12 },
        { ingredientName: 'Hạt sen Huế ninh đường', amount: 30 },
        { ingredientName: 'Kem béo Macchiato mặn', amount: 30 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
    {
      productName: 'Trà Đào Cam Sả',
      items: [
        { ingredientName: 'Trà đen hoa trân', amount: 12 },
        { ingredientName: 'Đào ngâm & syrup đào', amount: 40 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
    {
      productName: 'Trà Sữa Oolong Nướng',
      items: [
        { ingredientName: 'Trà Oolong nướng thượng hạng', amount: 15 },
        { ingredientName: 'Sữa tươi thanh trùng Dalatmilk', amount: 100 },
        { ingredientName: 'Sữa đặc Ngôi Sao Phương Nam', amount: 25 },
        { ingredientName: 'Ly giấy & Nắp sinh học 500ml', amount: 1 },
      ],
    },
  ];

  for (const recipe of recipesData) {
    const prodId = productMap.get(recipe.productName);
    if (!prodId) continue;

    for (const item of recipe.items) {
      const ingId = ingredientMap.get(item.ingredientName);
      if (!ingId) continue;

      await prisma.productRecipe.upsert({
        where: {
          productId_ingredientId: {
            productId: prodId,
            ingredientId: ingId,
          },
        },
        update: { amount: item.amount },
        create: {
          productId: prodId,
          ingredientId: ingId,
          amount: item.amount,
        },
      });
    }
  }

  // 5. SEED VOUCHER (3 Mã giảm giá: BREWLITE10, WELCOME20, BREWCOZY)
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

  // 6. SEED TÀI KHOẢN KHÁCH HÀNG DEMO
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
