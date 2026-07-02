import type {
  Budget,
  Category,
  Deal,
  Expense,
  FamilyMember,
  Receipt,
  ReceiptItem,
  ShoppingListItem,
  Tag,
  WatchlistItem,
  IncomeSource,
} from '@/types'

/** Dates are generated relative to first-run "today" so all period views look alive. */
function daysAgo(n: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const seedCategories: Category[] = [
  { id: 'cat_groceries', name: 'Groceries', icon: '🛒', color: '#16A34A' },
  { id: 'cat_dining', name: 'Dining', icon: '🍽️', color: '#FB8500' },
  { id: 'cat_transport', name: 'Transport', icon: '🚗', color: '#2386F6' },
  { id: 'cat_shopping', name: 'Shopping', icon: '🛍️', color: '#9B5DE5' },
  { id: 'cat_bills', name: 'Bills', icon: '📄', color: '#2386F6' },
  { id: 'cat_health', name: 'Health', icon: '❤️', color: '#EF4444' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: '⭐', color: '#F59E0B' },
]

export const seedTags: Tag[] = [
  { id: 'tag_personal', name: 'Personal', color: '#FB8500' },
  { id: 'tag_family', name: 'Family', color: '#FB8500' },
  { id: 'tag_school', name: 'School', color: '#9B5DE5' },
  { id: 'tag_subscription', name: 'Subscription', color: '#9B5DE5' },
  { id: 'tag_work', name: 'Work', color: '#16A34A' },
  { id: 'tag_travel', name: 'Travel', color: '#2386F6' },
]

export const seedFamilyMembers: FamilyMember[] = [
  { id: 'mem_mom', name: 'Mom', relationship: 'You', avatar: '👩', active: true, isDefault: true },
  { id: 'mem_dad', name: 'Dad', relationship: 'Husband', avatar: '👨', active: true },
  { id: 'mem_emma', name: 'Emma', relationship: 'Child 1', avatar: '👧', active: true },
  { id: 'mem_noah', name: 'Noah', relationship: 'Child 2', avatar: '👦', active: true },
  { id: 'mem_ava', name: 'Ava', relationship: 'Child 3', avatar: '🧒', active: true },
]

export const seedIncomeSources: IncomeSource[] = [
  { id: 'incsrc_salary', name: 'Salary', color: '#2386F6' },
  { id: 'incsrc_freelance', name: 'Freelance', color: '#16A34A' },
  { id: 'incsrc_investment', name: 'Investment', color: '#9B5DE5' },
  { id: 'incsrc_other', name: 'Other', color: '#F59E0B' },
]

export const seedBudget: Budget = {
  id: 'budget_main',
  period: 'monthly',
  limit: 1000,
  warningThreshold: 800,
  categoryAllocations: {
    cat_groceries: 300,
    cat_dining: 150,
    cat_transport: 150,
    cat_shopping: 150,
    cat_bills: 150,
    cat_health: 100,
  },
  warningNotifications: true,
  overBudgetAlerts: true,
}

export const seedExpenses: Expense[] = [
  // Recent (today / this week) so daily + weekly views populate
  { id: 'exp_1', amount: 5.75, date: daysAgo(0), merchant: 'Starbucks', categoryId: 'cat_dining', tagIds: ['tag_personal'], memberId: 'mem_dad', source: 'manual', notes: 'Morning coffee' },
  { id: 'exp_2', amount: 68.42, date: daysAgo(1), merchant: 'Whole Foods Market', categoryId: 'cat_groceries', tagIds: ['tag_family'], memberId: 'mem_mom', source: 'manual' },
  { id: 'exp_3', amount: 18.9, date: daysAgo(2), merchant: 'Uber Ride', categoryId: 'cat_transport', tagIds: ['tag_personal'], memberId: 'mem_dad', source: 'manual' },
  { id: 'exp_4', amount: 12.8, date: daysAgo(3), merchant: 'Kids Lunch', categoryId: 'cat_dining', tagIds: ['tag_family'], memberId: 'mem_noah', source: 'manual' },
  { id: 'exp_5', amount: 45.99, date: daysAgo(5), merchant: 'School Supplies', categoryId: 'cat_shopping', tagIds: ['tag_school'], memberId: 'mem_emma', source: 'manual' },
  // This month spread
  { id: 'exp_6', amount: 15.49, date: daysAgo(8), merchant: 'Netflix Subscription', categoryId: 'cat_bills', tagIds: ['tag_subscription'], memberId: 'mem_dad', source: 'manual' },
  { id: 'exp_7', amount: 120.0, date: daysAgo(10), merchant: 'Shell Gas', categoryId: 'cat_transport', tagIds: ['tag_family'], memberId: 'mem_mom', source: 'manual' },
  { id: 'exp_8', amount: 89.3, date: daysAgo(12), merchant: 'Target', categoryId: 'cat_shopping', tagIds: ['tag_family'], memberId: 'mem_mom', source: 'manual' },
  { id: 'exp_9', amount: 42.15, date: daysAgo(14), merchant: 'Trader Joes', categoryId: 'cat_groceries', tagIds: ['tag_family'], memberId: 'mem_mom', source: 'manual' },
  { id: 'exp_10', amount: 32.0, date: daysAgo(15), merchant: 'CVS Pharmacy', categoryId: 'cat_health', tagIds: ['tag_personal'], memberId: 'mem_mom', source: 'manual' },
  { id: 'exp_11', amount: 24.5, date: daysAgo(18), merchant: 'Chipotle', categoryId: 'cat_dining', tagIds: ['tag_family'], memberId: 'mem_emma', source: 'manual' },
  { id: 'exp_12', amount: 9.99, date: daysAgo(20), merchant: 'Spotify', categoryId: 'cat_bills', tagIds: ['tag_subscription'], memberId: 'mem_dad', source: 'manual' },
  { id: 'exp_13', amount: 56.2, date: daysAgo(22), merchant: 'Costco', categoryId: 'cat_groceries', tagIds: ['tag_family'], memberId: 'mem_mom', source: 'manual' },
  { id: 'exp_14', amount: 16.0, date: daysAgo(24), merchant: 'AMC Theatres', categoryId: 'cat_entertainment', tagIds: ['tag_family'], memberId: 'mem_noah', source: 'manual' },
  { id: 'exp_15', amount: 38.75, date: daysAgo(26), merchant: 'Old Navy', categoryId: 'cat_shopping', tagIds: ['tag_personal'], memberId: 'mem_ava', source: 'manual' },
]

export const seedReceipts: Receipt[] = []
export const seedReceiptItems: ReceiptItem[] = []

export const seedWatchlistItems: WatchlistItem[] = [
  { id: 'wl_1', name: 'Pampers Swaddlers Size 4', merchant: 'Walmart', currentPrice: 23.97, originalPrice: 28.97, status: 'on_sale', imageUrl: '' },
  { id: 'wl_2', name: 'Tide Liquid Laundry Detergent', merchant: 'Target', currentPrice: 11.99, originalPrice: 15.99, status: 'new_deal', imageUrl: '' },
  { id: 'wl_3', name: "Annie's Cheddar Bunnies", merchant: 'Amazon', currentPrice: 3.49, status: 'watching', imageUrl: '' },
  { id: 'wl_4', name: 'Nature Made Multivitamin (Men)', merchant: 'Costco', currentPrice: 17.49, status: 'watching', imageUrl: '' },
  { id: 'wl_5', name: 'Air Fryer Liners (100 Pack)', merchant: 'Walmart', currentPrice: 6.98, originalPrice: 9.98, status: 'new_deal', imageUrl: '' },
]

export const seedDeals: Deal[] = [
  { id: 'deal_1', watchlistItemId: 'wl_x1', name: 'Huggies Ultra Dry Nappies Size 4', merchant: 'Chemist Warehouse', originalPrice: 32.99, salePrice: 22.49, discountPercent: 32, foundAt: daysAgo(0), actionStatus: 'new' },
  { id: 'deal_2', watchlistItemId: 'wl_x2', name: 'OMO Ultimate Laundry Liquid 2L', merchant: 'Woolworths', originalPrice: 18.99, salePrice: 11.9, discountPercent: 37, foundAt: daysAgo(0), actionStatus: 'new' },
  { id: 'deal_3', watchlistItemId: 'wl_x3', name: "Kellogg's Nutri-Grain Cereal 765g", merchant: 'Coles', originalPrice: 8.0, salePrice: 5.0, discountPercent: 38, foundAt: daysAgo(0), actionStatus: 'new' },
  { id: 'deal_4', watchlistItemId: 'wl_x4', name: "Swisse Women's Ultivite 60 Tablets", merchant: 'Priceline', originalPrice: 27.99, salePrice: 19.59, discountPercent: 30, foundAt: daysAgo(0), actionStatus: 'new' },
  { id: 'deal_5', watchlistItemId: 'wl_x5', name: 'Finish All In 1 Max Dishwasher Tablets 80pk', merchant: 'ALDI', originalPrice: 21.99, salePrice: 14.99, discountPercent: 32, foundAt: daysAgo(0), actionStatus: 'new' },
  { id: 'deal_6', watchlistItemId: 'wl_x6', name: 'Berocca Performance Effervescent 45 Tablets', merchant: 'Chemist Warehouse', originalPrice: 26.99, salePrice: 17.49, discountPercent: 35, foundAt: daysAgo(0), actionStatus: 'new' },
]

export const seedShoppingList: ShoppingListItem[] = []
