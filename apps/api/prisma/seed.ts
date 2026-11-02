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

async function main(): Promise<void> {
  const toppingSeeds = [
    { name: 'Trân châu', price: 5000 },
    { name: 'Thạch', price: 5000 },
    { name: 'Kem cheese', price: 10000 },
  ];
  for (const topping of toppingSeeds) {
    await prisma.topping.upsert({
      where: { name: topping.name },
      update: { price: topping.price },
      create: topping,
    });
  }
  const toppings = await prisma.topping.findMany();
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const saved = await prisma.product.upsert({
      where: { name: product.name },
      update: { imageUrl: `/images/products/${i + 1}.svg` },
      create: { ...product, imageUrl: `/images/products/${i + 1}.svg` },
    });
    for (const topping of toppings) {
      await prisma.productTopping.upsert({
        where: { productId_toppingId: { productId: saved.id, toppingId: topping.id } },
        update: {},
        create: { productId: saved.id, toppingId: topping.id },
      });
    }
  }
  console.log(`Seed checked: ${products.length} products, ${toppings.length} toppings`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
