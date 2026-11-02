import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  { name: 'Cà phê đen', basePrice: 25000, stock: 50 },
  { name: 'Cà phê sữa', basePrice: 29000, stock: 50 },
  { name: 'Bạc xỉu', basePrice: 32000, stock: 50 },
  { name: 'Trà đào cam sả', basePrice: 45000, stock: 40 },
  { name: 'Trà vải', basePrice: 42000, stock: 40 },
  { name: 'Matcha latte', basePrice: 49000, stock: 30 },
  { name: 'Sinh tố bơ', basePrice: 52000, stock: 20 },
  { name: 'Nước cam ép', basePrice: 39000, stock: 0 },
];

// upsert theo `name` (unique) nên chạy lại nhiều lần không nhân đôi dữ liệu.
async function main(): Promise<void> {
  for (const p of products) {
    await prisma.product.upsert({ where: { name: p.name }, update: {}, create: p });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
