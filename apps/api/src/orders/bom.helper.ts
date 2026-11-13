export interface RequiredIngredientItem {
  ingredientId: number;
  code: string;
  name: string;
  unit: string;
  requiredAmount: number;
  isRequired: boolean;
}

/**
 * Tính toán định lượng nguyên vật liệu (BOM) cần thiết cho danh sách món trong đơn hàng.
 * Bao gồm:
 * 1. Nguyên liệu theo công thức đồ uống / bánh ngọt (Recipe).
 * 2. Bao bì đi kèm: Ống hút bio / phi boba.
 * 3. Nguyên liệu theo Topping (ToppingRecipe).
 * 4. Phụ kiện dùng chung: Túi mang đi (T-bag, 2-cup bag), Khăn giấy, Muỗng.
 */
export async function computeRequiredIngredients(
  tx: any,
  items: Array<{
    productId: number;
    size: string;
    toppings: string[];
    quantity: number;
  }>,
): Promise<RequiredIngredientItem[]> {
  if (!tx.recipe || !tx.ingredient) {
    return [];
  }

  const productIds = [...new Set(items.map((i) => i.productId))];
  const [recipes, toppingRecipes, products, auxPackaging] = await Promise.all([
    tx.recipe.findMany({
      where: { productId: { in: productIds } },
      include: { ingredient: true },
    }),
    tx.toppingRecipe
      ? tx.toppingRecipe.findMany({
          include: { ingredient: true },
        })
      : Promise.resolve([]),
    tx.product?.findMany
      ? tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, category: true },
        })
      : Promise.resolve([]),
    tx.ingredient?.findMany
      ? tx.ingredient.findMany({
          where: {
            code: {
              in: [
                'PKG_STRAW_BIO',
                'PKG_STRAW_BOBA',
                'PKG_BAG_T',
                'PKG_BAG_2CUP',
                'PKG_TISSUE',
                'PKG_SPOON',
              ],
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map<number, any>(
    (products || []).map((p: any) => [p.id, p]),
  );
  const auxPkgMap = new Map<string, any>(
    (auxPackaging || []).map((ing: any) => [ing.code, ing]),
  );

  const reqMap = new Map<number, RequiredIngredientItem>();

  const addRequirement = (ing: any, amount: number, defaultRequired = true) => {
    if (!ing || amount <= 0) return;
    const resolvedRequired = ing.isRequiredForSale ?? defaultRequired;
    const existing = reqMap.get(ing.id);
    if (existing) {
      existing.requiredAmount = Number(
        (existing.requiredAmount + amount).toFixed(2),
      );
      existing.isRequired = existing.isRequired || resolvedRequired;
    } else {
      reqMap.set(ing.id, {
        ingredientId: ing.id,
        code: ing.code,
        name: ing.name,
        unit: ing.unit,
        requiredAmount: Number(amount.toFixed(2)),
        isRequired: resolvedRequired,
      });
    }
  };

  let totalDrinkCups = 0;
  let totalPastries = 0;

  for (const item of items) {
    const normalizedSize = (item.size || 'M').toUpperCase();
    const matchedRecipes = recipes.filter(
      (r: any) =>
        r.productId === item.productId &&
        (r.size === normalizedSize || r.size === 'ALL'),
    );

    for (const r of matchedRecipes) {
      addRequirement(r.ingredient, r.amount * item.quantity, true);
    }

    const prod = productMap.get(item.productId);
    const isBakery =
      prod?.category === 'bakery' ||
      matchedRecipes.some(
        (r: any) =>
          r.ingredient?.code?.startsWith('ING_PAIN') ||
          r.ingredient?.code?.startsWith('ING_CHEESE') ||
          r.ingredient?.code?.startsWith('ING_TIRAMISU'),
      );

    if (isBakery) {
      totalPastries += item.quantity;
    } else {
      totalDrinkCups += item.quantity;
      const hasBoba =
        Array.isArray(item.toppings) &&
        item.toppings.some((topStr: string) => {
          const low = topStr.toLowerCase();
          return (
            low.includes('boba') ||
            low.includes('trân châu') ||
            low.includes('thạch')
          );
        });
      const strawCode = hasBoba ? 'PKG_STRAW_BOBA' : 'PKG_STRAW_BIO';
      const strawIng = auxPkgMap.get(strawCode);
      if (strawIng) {
        addRequirement(strawIng, item.quantity, false);
      }
    }

    if (Array.isArray(item.toppings) && item.toppings.length > 0) {
      for (const topStr of item.toppings) {
        const lowerTop = topStr.toLowerCase().trim();
        if (!lowerTop) continue;
        // Prefer exact toppingId/toppingName match so similarly named toppings stay isolated across BOM rows
        const exactTops = toppingRecipes.filter(
          (tr: any) =>
            tr.toppingId?.toLowerCase() === lowerTop ||
            tr.toppingName?.toLowerCase() === lowerTop,
        );
        const matchedTops =
          exactTops.length > 0
            ? exactTops
            : toppingRecipes.filter(
                (tr: any) =>
                  tr.toppingName?.toLowerCase().includes(lowerTop) ||
                  lowerTop.includes(tr.toppingName?.toLowerCase()),
              );
        for (const tr of matchedTops) {
          addRequirement(tr.ingredient, tr.amount * item.quantity, true);
        }
      }
    }
  }

  if (totalDrinkCups > 0) {
    const bag2CupCount = Math.floor(totalDrinkCups / 2);
    const bagTCount = totalDrinkCups % 2;
    const bag2CupIng = auxPkgMap.get('PKG_BAG_2CUP');
    const bagTIng = auxPkgMap.get('PKG_BAG_T');
    const tissueIng = auxPkgMap.get('PKG_TISSUE');

    if (bag2CupIng && bag2CupCount > 0) {
      addRequirement(bag2CupIng, bag2CupCount, false);
    }
    if (bagTIng && bagTCount > 0) {
      addRequirement(bagTIng, bagTCount, false);
    }
    if (tissueIng) {
      addRequirement(tissueIng, totalDrinkCups, false);
    }
  }

  if (totalPastries > 0) {
    const spoonIng = auxPkgMap.get('PKG_SPOON');
    if (spoonIng) {
      addRequirement(spoonIng, totalPastries, false);
    }
  }

  return Array.from(reqMap.values()).sort(
    (a, b) => a.ingredientId - b.ingredientId,
  );
}
