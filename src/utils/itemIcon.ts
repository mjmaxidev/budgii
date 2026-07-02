/** Keyword rules — first match wins. Picks an item icon from the name, not the category. */
const KEYWORD_ICONS: Array<[RegExp, string]> = [
  [/\b(towel|tissue|toilet paper|paper towel)/i, '🧻'],
  [/\b(soap|shampoo|conditioner|lotion)\b/i, '🧴'],
  [/\b(detergent|cleaner|bleach|disinfect)\b/i, '🧽'],
  [/\b(diaper|wipes)\b/i, '👶'],
  [/\b(milk|cream|half.and.half)\b/i, '🥛'],
  [/\b(banana|plantain)\b/i, '🍌'],
  [/\b(apple|pear|fruit)\b/i, '🍎'],
  [/\b(orange|citrus|lemon|lime)\b/i, '🍊'],
  [/\b(berry|strawberr|blueberr|raspberr)\b/i, '🫐'],
  [/\b(grape)\b/i, '🍇'],
  [/\b(yogurt|yoghurt)\b/i, '🥣'],
  [/\b(bread|bagel|roll|bun|croissant)\b/i, '🍞'],
  [/\b(coffee|espresso|latte|cappuccino|beans)\b/i, '☕'],
  [/\b(tea)\b/i, '🍵'],
  [/\b(pizza)\b/i, '🍕'],
  [/\b(burger|sandwich|wrap)\b/i, '🍔'],
  [/\b(salad|lettuce|spinach|kale|greens|vegetable|broccoli|carrot)\b/i, '🥬'],
  [/\b(rice|pasta|noodle|spaghetti)\b/i, '🍝'],
  [/\b(chicken|poultry|turkey)\b/i, '🍗'],
  [/\b(beef|steak|pork|meat|bacon|sausage)\b/i, '🥩'],
  [/\b(fish|salmon|tuna|seafood|shrimp)\b/i, '🐟'],
  [/\b(egg)\b/i, '🥚'],
  [/\b(cheese)\b/i, '🧀'],
  [/\b(chip|crisp|snack|cookie|cracker|candy|chocolate)\b/i, '🍪'],
  [/\b(water|juice|soda|cola|drink|beverage|sparkling)\b/i, '🥤'],
  [/\b(beer|wine|alcohol|spirit)\b/i, '🍷'],
  [/\b(uber|lyft|taxi|cab|ride|trip|transit|bus|train|metro)\b/i, '🚗'],
  [/\b(gas|fuel|petrol|diesel)\b/i, '⛽'],
  [/\b(parking|toll)\b/i, '🅿️'],
  [/\b(pharmacy|medicine|vitamin|aspirin|ibuprofen|prescription)\b/i, '💊'],
  [/\b(pet|dog|cat)\b/i, '🐾'],
  [/\b(flower|bouquet)\b/i, '💐'],
  [/\b(candle)\b/i, '🕯️'],
  [/\b(battery)\b/i, '🔋'],
  [/\b(phone|charger|cable|electronic)\b/i, '📱'],
  [/\b(book|magazine)\b/i, '📚'],
  [/\b(toy|game)\b/i, '🎮'],
  [/\b(shirt|pants|sock|clothing|jacket|shoe)\b/i, '👕'],
]

export function iconForItemName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '🏷️'
  for (const [pattern, icon] of KEYWORD_ICONS) {
    if (pattern.test(trimmed)) return icon
  }
  return '🏷️'
}
