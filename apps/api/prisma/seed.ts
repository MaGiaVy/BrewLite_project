import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const drinks = [
  ['Cà phê sữa', 35000, 20], ['Cà phê đen', 30000, 20],
  ['Bạc xỉu', 40000, 18], ['Trà đào', 45000, 20],
  ['Trà vải', 45000, 10], ['Matcha latte', 55000, 12],
  ['Chocolate đá', 48000, 0], ['Trà sữa', 49000, 16],
] as const;
async function main() {
  const toppingSeeds = [['Trân châu', 5000], ['Thạch', 5000], ['Kem cheese', 10000]] as const;
  for (let i = 0; i < toppingSeeds.length; i++) {
    const [name, price] = toppingSeeds[i];
    await db.topping.upsert({ where: { name }, update: { price }, create: { name, price } });
  }
  const toppings = await db.topping.findMany();
  for (let i = 0; i < drinks.length; i++) {
    const [name, price, stock] = drinks[i];
    const id = i + 1;
    await db.product.upsert({
      where: { id },
      update: { name, price, stock, imageUrl: `/images/products/${id}.jpg` },
      create: { id, name, price, stock, imageUrl: `/images/products/${id}.jpg` },
    });
    for (const topping of toppings) {
      await db.productTopping.upsert({
        where: { productId_toppingId: { productId: id, toppingId: topping.id } },
        update: {}, create: { productId: id, toppingId: topping.id },
      });
    }
  }
}
main().finally(async () => db.$disconnect());
