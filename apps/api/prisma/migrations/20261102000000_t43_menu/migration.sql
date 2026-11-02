ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT;
CREATE TABLE "Topping" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL
);
CREATE UNIQUE INDEX "Topping_name_key" ON "Topping"("name");
CREATE TABLE "ProductTopping" (
  "productId" INTEGER NOT NULL,
  "toppingId" INTEGER NOT NULL,
  CONSTRAINT "ProductTopping_pkey" PRIMARY KEY ("productId", "toppingId")
);
ALTER TABLE "ProductTopping" ADD CONSTRAINT "ProductTopping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductTopping" ADD CONSTRAINT "ProductTopping_toppingId_fkey" FOREIGN KEY ("toppingId") REFERENCES "Topping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
