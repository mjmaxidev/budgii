# Codex Build Spec｜Smart Budget Tracker MVP + Milestone 2 Deal Watchlist

## 0. What to build

Build a **mobile-first React app / PWA** for a household budget tracker.

Core positioning:

> Smart Budget Tracker with AI Receipt Breakdown for household spending.

Primary user:

> A mother / household manager tracking spending by category, tag, family member, budget, receipts, and later deal alerts.

Use the included UI reference images in `ui-references/` as visual direction. Recreate the screens as React UI, not as static images.

---

## 1. Tech stack

Use:

```bash
React + Vite + TypeScript
Tailwind CSS
React Router
Zustand for state
localStorage persistence
lucide-react for icons
```

Do not use a backend for MVP 1.0. Mock OCR and AI with deterministic local logic.

Recommended setup:

```bash
npm create vite@latest smart-budget-tracker -- --template react-ts
cd smart-budget-tracker
npm install
npm install react-router-dom zustand lucide-react clsx
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## 2. Visual style

Match these design traits:

```text
Mobile-first, 375px-430px wide feel
Soft warm beige app background
White rounded cards
Orange primary CTA
Green success / budget-safe / deal-positive color
Red over-budget / destructive color
Pastel category/tag/member chips
Large touch targets: min 44px height
Rounded corners: 16px-28px
Soft shadows
Clean sans-serif typography
Lots of padding and spacing
```

Design tokens:

```ts
const theme = {
  colors: {
    bg: '#FFF5EA',
    surface: '#FFFFFF',
    surfaceSoft: '#FFFBF6',
    primary: '#FF6A00',
    primarySoft: '#FFF0E5',
    green: '#16A34A',
    greenSoft: '#EAF8ED',
    orange: '#FB8500',
    orangeSoft: '#FFF2DF',
    red: '#EF4444',
    redSoft: '#FEECEC',
    blue: '#2386F6',
    blueSoft: '#EAF4FF',
    purple: '#9B5DE5',
    purpleSoft: '#F2E8FF',
    yellowSoft: '#FFF7D6',
    text: '#111827',
    textMuted: '#6B7280',
    border: '#EFE5DA'
  },
  radius: {
    card: '24px',
    input: '18px',
    pill: '999px'
  }
}
```

---

## 3. UI reference files

Use these image files as visual references:

```text
ui-references/01-login.png
ui-references/02-home-dashboard.png
ui-references/03-add-expense-with-receipt.png
ui-references/04-scan-receipt.png
ui-references/05-receipt-results.png
ui-references/06-item-detail.png
ui-references/07-reports-budget.png
ui-references/08-set-up-budget.png
ui-references/09-categories-tags.png
ui-references/10-family-members.png
ui-references/11-spending-breakdown-touch-friendly.png
ui-references/12-deal-watchlist-m2.png
ui-references/13-todays-deal-report-m2.png
ui-references/14-deal-cards-m2.png
```

MVP 1.0 needs screens 01-11. Milestone 2 needs screens 12-14.

---

## 4. App routes

Use React Router.

```ts
/login
/home
/add-expense
/scan-receipt
/receipt-results/:receiptId
/item/:itemId
/transactions
/reports
/spending-breakdown
/budget-setup
/categories-tags
/family-members
/settings

// Milestone 2 routes, build UI but feature can use mock data first
/deal-watchlist
/todays-deal-report
/deal-cards
/shopping-list
```

Default route:

```ts
/ -> /home
```

---

## 5. MVP 1.0 screens

### 01 Login / Welcome

Reference: `01-login.png`

Build:

```text
Hero illustration area using CSS/simple icon/card, or placeholder illustration
Title: Track Smarter Spending
Email field
Password field
Log In button
Create Account button
Continue with Apple
Continue with Google
```

For MVP, login can just navigate to `/home`.

---

### 02 Home Dashboard

Reference: `02-home-dashboard.png`

Build:

```text
Greeting
Daily / Weekly / Monthly segmented control
Budget progress ring
Spent amount
Remaining amount
Category mini cards
Recent transactions
Bottom navigation
Center Add button
```

Behavior:

```text
Green ring: spent < warning threshold
Orange ring: spent >= warning threshold and <= budget limit
Red ring: spent > budget limit
```

---

### 03 Add Expense with Receipt Attachment

Reference: `03-add-expense-with-receipt.png`

Build:

```text
Amount field
Date
Merchant
Category selector
Tags selector
Notes
Receipt section
  - Take Photo
  - Upload Receipt
  - Attached receipt card with thumbnail, name, file size, attached status, View button
Create New Category
Save Expense
```

Behavior:

```text
Save creates expense record.
Take Photo can trigger file input with capture='environment'.
Upload Receipt uses file input.
Receipt thumbnail should preview selected image.
```

---

### 04 Scan Receipt

Reference: `04-scan-receipt.png`

Build:

```text
Receipt scan frame
Scan Receipt button
Upload Photo button
Analyzing receipt status card
```

Behavior:

```text
Upload image -> show analyzing for 1 sec -> create mock receipt -> navigate to /receipt-results/:receiptId
```

No real OCR for MVP. Use mock extracted receipt items.

---

### 05 Receipt Results

Reference: `05-receipt-results.png`

Build:

```text
Merchant
Date
Total
6 extracted items
Each item row: icon, name, category, confidence, amount, edit icon
Confirm All Items
Add Missing Item
Looks good status card
```

Behavior:

```text
Edit item category/tag/member in modal or drawer.
Confirm All Items creates transaction item records.
```

---

### 06 Item Detail + Source Receipt

Reference: `06-item-detail.png`

Build:

```text
Item name
Amount
Category chip
AI confidence chip
Merchant
Date
Tags
Receipt ID
Source Receipt thumbnail
Open Receipt button
Remove This Item
```

Behavior:

```text
Open Receipt opens full-screen receipt viewer modal.
Remove item removes transaction item.
```

---

### 07 Reports & Budget

Reference: `07-reports-budget.png`

Build:

```text
Daily / Weekly / Monthly tabs
Spending overview bar chart
Budget settings summary
Three budget rings: good, caution, over
Over-budget alert card
Increase This Month
Adjust Next Month
```

Behavior:

```text
Increase This Month opens budget setup with current month mode.
Adjust Next Month opens budget setup with next month mode.
```

---

### 08 Set Up Budget

Reference: `08-set-up-budget.png`

Build:

```text
Budget Period
Total Monthly Budget
Warning Threshold
Allocate by Category
Warning Notifications toggle
Over-Budget Alerts toggle
Live Preview green/orange/red rings
Save Budget
```

Validation:

```text
warningThreshold < monthlyBudget
category allocations <= monthlyBudget
```

---

### 09 Categories & Tags

Reference: `09-categories-tags.png`

Build:

```text
Categories grid
Edit link
Add Category
Tags section
Add Tag
```

Behavior:

```text
Add/edit/delete category
Add/edit/delete tag
```

---

### 10 Family Members

Reference: `10-family-members.png`

Build:

```text
Household Members grid
Mom, Dad, Emma, Noah, Ava
Add Member
How it works card
Member Tag Settings
Use members as expense tags toggle
Suggest member based on receipt history toggle
Example Tags
Save Members
```

Behavior:

```text
Members behave like assignable tags on expenses and receipt line items.
```

---

### 11 Spending Breakdown

Reference: `11-spending-breakdown-touch-friendly.png`

This is the improved touch-friendly version.

Build:

```text
Header: Spending Breakdown
Daily / Weekly / Monthly tabs
May 2024 summary card
By Category larger rows
By Tags horizontal carousel style cards
By Members horizontal carousel style cards
This Month Details larger rows
```

Important:

```text
Use larger touch targets.
Do not make content tiny.
Tags and members can horizontally scroll.
All rows should be tappable.
```

---

## 6. Settings page

Build a Settings page even if no image reference was generated yet.

Sections:

```text
Account
  - Profile
  - Email & Password
  - Currency
  - Language

Budget
  - Monthly Budget
  - Warning Threshold
  - Category Budget Allocation

Family
  - Family Members
  - Member Tags
  - Shared Household Profile later

Categories & Tags
  - Manage Categories
  - Manage Tags

Receipt & AI
  - Receipt Scan Settings
  - Auto Categorization
  - AI Confidence Review
  - Receipt Storage

Reports
  - Default Report View
  - Export Reports later

Notifications
  - Budget Alerts
  - Weekly / Monthly Summary
  - Receipt Processing Alerts

Privacy & Security
  - Face ID / App Lock placeholder
  - Data Privacy
  - Delete Account

Data & Backup
  - Backup later
  - Export Data later
  - Import Data later

Support
  - Help Center
  - Contact Support
  - Terms & Privacy Policy

Logout
```

---

## 7. Milestone 2 screens: Deal Watchlist Agent

Build these screens as UI with mock data only in this pass.

### 12 Deal Watchlist

Reference: `12-deal-watchlist-m2.png`

Purpose:

```text
User saves wanted products and waits until favorite merchants discount them.
AI agent checks daily at 7:00 AM.
```

Build:

```text
Daily AI Deal Check card
Next report: 7:00 AM
Tracked Items cards
On Sale / New Deal / Watching states
Add Item button
```

---

### 13 Today’s Deal Report

Reference: `13-todays-deal-report-m2.png`

Build:

```text
Tabs: All / On Sale / Watchlist
Summary: 6 matching deals found today, Updated at 7:00 AM
List of deal rows
Actions: View, Add to Shopping List, Save for Later
```

---

### 14 Deal Cards

Reference: `14-deal-cards-m2.png`

Build:

```text
Tinder-style swipe/card stack UI
Main product card
Product image
Merchant
Original price
Sale price
Discount
Best deal / today only badge
Question: Add this to today’s shopping list?
Actions:
  - Skip X
  - Keep Watching
  - Add to Shopping List check
```

Behavior:

```text
Skip: do not add to shopping list; keep in bucket/watchlist.
Keep Watching: same as skip but mark as still watching.
Add to Shopping List: add deal item to today's shopping list.
```

---

## 8. Data model

Use TypeScript types.

```ts
export type Category = {
  id: string
  name: string
  icon: string
  color: string
}

export type Tag = {
  id: string
  name: string
  color: string
}

export type FamilyMember = {
  id: string
  name: string
  relationship: 'You' | 'Husband' | 'Child 1' | 'Child 2' | 'Child 3' | string
  avatar: string
  active: boolean
  isDefault?: boolean
}

export type Expense = {
  id: string
  amount: number
  date: string
  merchant: string
  categoryId: string
  tagIds: string[]
  memberId?: string
  notes?: string
  receiptId?: string
  source: 'manual' | 'receipt_ai'
}

export type Receipt = {
  id: string
  merchant: string
  date: string
  total: number
  imageUrl?: string
  ocrText?: string
  itemIds: string[]
  status: 'uploaded' | 'analyzing' | 'needs_review' | 'processed' | 'failed'
}

export type ReceiptItem = {
  id: string
  receiptId: string
  name: string
  amount: number
  categoryId: string
  tagIds: string[]
  memberId?: string
  aiConfidence: number
  manuallyEdited?: boolean
}

export type Budget = {
  id: string
  period: 'monthly' | 'weekly' | 'daily'
  limit: number
  warningThreshold: number
  categoryAllocations: Record<string, number>
  warningNotifications: boolean
  overBudgetAlerts: boolean
}

export type WatchlistItem = {
  id: string
  name: string
  merchant: string
  imageUrl?: string
  targetPrice?: number
  currentPrice?: number
  originalPrice?: number
  status: 'watching' | 'on_sale' | 'new_deal'
  lastCheckedAt?: string
}

export type Deal = {
  id: string
  watchlistItemId: string
  name: string
  merchant: string
  imageUrl?: string
  originalPrice: number
  salePrice: number
  discountPercent: number
  foundAt: string
  actionStatus: 'new' | 'added_to_shopping_list' | 'skipped' | 'keep_watching'
}

export type ShoppingListItem = {
  id: string
  dealId?: string
  name: string
  merchant?: string
  expectedPrice?: number
  checked: boolean
  date: string
}
```

---

## 9. State management

Use Zustand store with localStorage persistence.

Store shape:

```ts
type AppStore = {
  categories: Category[]
  tags: Tag[]
  familyMembers: FamilyMember[]
  expenses: Expense[]
  receipts: Receipt[]
  receiptItems: ReceiptItem[]
  budget: Budget
  watchlistItems: WatchlistItem[]
  deals: Deal[]
  shoppingList: ShoppingListItem[]

  addExpense: (input: Partial<Expense>) => void
  updateExpense: (id: string, patch: Partial<Expense>) => void
  deleteExpense: (id: string) => void

  addReceiptFromImage: (file: File) => Promise<string>
  confirmReceiptItems: (receiptId: string) => void
  updateReceiptItem: (id: string, patch: Partial<ReceiptItem>) => void

  addCategory: (name: string) => void
  addTag: (name: string) => void
  addFamilyMember: (member: Partial<FamilyMember>) => void
  updateBudget: (patch: Partial<Budget>) => void

  addWatchlistItem: (item: Partial<WatchlistItem>) => void
  mockRunDailyDealCheck: () => void
  addDealToShoppingList: (dealId: string) => void
  skipDeal: (dealId: string) => void
  keepWatchingDeal: (dealId: string) => void
}
```

---

## 10. Mock data

Seed the app with realistic demo data so all screens look alive immediately.

Categories:

```text
Groceries, Dining, Transport, Shopping, Bills, Health, Entertainment
```

Tags:

```text
Personal, Family, School, Subscription, Work, Travel
```

Family members:

```text
Mom / You
Dad / Husband
Emma / Child 1
Noah / Child 2
Ava / Child 3
```

Transactions for May 2024:

```text
Whole Foods Market, $68.42, Groceries, Family, Mom
School Supplies, $45.99, Shopping, School, Emma
Starbucks, $5.75, Dining, Personal, Dad
Kids Lunch, $12.80, Dining, Family, Noah
Netflix Subscription, $15.49, Bills, Subscription, Dad
```

Mock OCR receipt:

```text
Whole Foods Market
Milk 1% $3.49 -> Groceries -> Mom
Organic Bananas $2.38 -> Groceries -> Family
Greek Yogurt $1.99 -> Groceries -> Family
Whole Grain Bread $3.79 -> Groceries -> Family
Coffee Beans $8.99 -> Dining -> Dad
Uber Trip $18.90 -> Transport -> Dad
Total $39.54
```

Deal watchlist:

```text
Pampers Swaddlers Size 4 / Walmart / $23.97 / 17% off
Tide Liquid Laundry Detergent / Target / $11.99 / 25% off
Annie’s Cheddar Bunnies / Amazon / $3.49 / no deal yet
Nature Made Multivitamin Men / Costco / $17.49 / no deal yet
Air Fryer Liners 100 Pack / Walmart / $6.98 / 30% off
```

Today’s deals:

```text
Huggies Ultra Dry Nappies Size 4 / Chemist Warehouse / $22.49 / 32% off
OMO Ultimate Laundry Liquid 2L / Woolworths / $11.90 / 37% off
Kellogg’s Nutri-Grain Cereal 765g / Coles / $5.00 / 38% off
Swisse Women’s Ultivite 60 Tablets / Priceline / $19.59 / 30% off
Finish All In 1 Max Dishwasher Tablets 80pk / ALDI / $14.99 / 32% off
Berocca Performance Effervescent 45 Tablets / Chemist Warehouse / $17.49 / 35% off
```

---

## 11. Component architecture

Create reusable components:

```text
AppShell
MobileFrame optional for dev preview
TopBar
BottomNav
SegmentedControl
Card
StatCard
ProgressRing
ProgressBar
CategoryIcon
Chip
MoneyText
EmptyState
ActionButton
FloatingActionButton
FormField
SelectRow
ToggleRow
ReceiptThumbnail
ReceiptItemRow
TransactionRow
CategoryBreakdownRow
TagCarouselCard
MemberCarouselCard
DealWatchlistCard
DealReportRow
DealSwipeCard
```

Suggested folder structure:

```text
src/
  app/
    router.tsx
  components/
    ui/
    layout/
    finance/
    receipts/
    deals/
  data/
    seed.ts
  store/
    appStore.ts
  types/
    index.ts
  utils/
    money.ts
    dates.ts
    budget.ts
    mockAi.ts
  pages/
    Login.tsx
    Home.tsx
    AddExpense.tsx
    ScanReceipt.tsx
    ReceiptResults.tsx
    ItemDetail.tsx
    Transactions.tsx
    ReportsBudget.tsx
    SpendingBreakdown.tsx
    BudgetSetup.tsx
    CategoriesTags.tsx
    FamilyMembers.tsx
    Settings.tsx
    DealWatchlist.tsx
    TodaysDealReport.tsx
    DealCards.tsx
    ShoppingList.tsx
```

---

## 12. Behavior requirements

### Budget status

```ts
function getBudgetStatus(spent: number, limit: number, warningThreshold: number) {
  if (spent > limit) return 'over'
  if (spent >= warningThreshold) return 'warning'
  return 'good'
}
```

Visual mapping:

```text
good = green
warning = orange
over = red
```

### Receipt AI mock

When user uploads a receipt image:

```text
1. Create receipt record with status = analyzing
2. After timeout, populate mock items
3. Assign categories/tags/members using mock rules
4. Set status = needs_review
5. Navigate to Receipt Results
```

### Deal agent mock

For Milestone 2:

```text
Daily at 7:00 AM is UI-only for now.
Button or mock function runs deal check.
Generate today's deal report from seeded deals.
Highlight active deals.
Deal cards let user add to shopping list or skip.
```

---

## 13. UX requirements

```text
All tappable rows/buttons should be at least 44px high.
Use bigger cards for mobile touch.
Tags and members sections in Spending Breakdown should be horizontal carousel/scroll rows.
Do not cram text.
Use ellipsis for long product or merchant names.
All main buttons should have clear pressed/hover states.
Use empty states for no data.
Use confirmation for delete actions.
```

---

## 14. Implementation phases for Codex

### Phase 1: Project shell

```text
Set up Vite React TS, Tailwind, routing, Zustand, theme tokens, base components, mock data.
```

### Phase 2: MVP static UI

```text
Build screens 01-11 with mock data and navigation.
Focus on matching reference images and mobile usability.
```

### Phase 3: Local CRUD

```text
Make expenses/categories/tags/family/budget editable with Zustand + localStorage.
```

### Phase 4: Receipt flow

```text
Add image upload, receipt preview, mock OCR extraction, editable receipt items, item detail with source receipt.
```

### Phase 5: Reports logic

```text
Compute totals by category, tag, member, monthly details, budget status, warning/over-budget states.
```

### Phase 6: Milestone 2 UI only

```text
Build Deal Watchlist, Today's Deal Report, Deal Cards, and Shopping List with mock data.
No real web scraping yet.
```

---

## 15. First prompt to paste into Codex

Paste this into Codex first:

```text
You are building a mobile-first React + Vite + TypeScript + Tailwind PWA called Smart Budget Tracker.

Use the project spec in CODEX_BUILD_SPEC.md and the UI reference images in ui-references/ as the source of truth.

Start with Phase 1 only:
1. Create the Vite React TypeScript app structure.
2. Install and configure Tailwind CSS.
3. Add React Router routes for all MVP and Milestone 2 pages listed in the spec.
4. Add Zustand store with localStorage persistence.
5. Create TypeScript data models from the spec.
6. Add seed mock data for categories, tags, family members, expenses, budget, receipts, receipt items, watchlist items, deals, and shopping list.
7. Create reusable base components: AppShell, TopBar, BottomNav, Card, SegmentedControl, Chip, ProgressRing, ProgressBar, FormField, ToggleRow, FloatingActionButton.
8. Create placeholder pages for every route so the app can navigate without errors.

Do not implement full screen UIs yet. Build the foundation cleanly and keep the design system consistent with the orange/white/green rounded mobile UI references.

After finishing, explain the file structure and how to run the app.
```

---

## 16. Second prompt to paste into Codex

After Phase 1 works, paste:

```text
Now build Phase 2: static UI screens for MVP 1.0.

Use these UI references:
- 01-login.png
- 02-home-dashboard.png
- 03-add-expense-with-receipt.png
- 04-scan-receipt.png
- 05-receipt-results.png
- 06-item-detail.png
- 07-reports-budget.png
- 08-set-up-budget.png
- 09-categories-tags.png
- 10-family-members.png
- 11-spending-breakdown-touch-friendly.png

Recreate the screens as React components using Tailwind and existing reusable components. Do not use the reference images as the actual UI; they are visual references only.

Keep all components mobile-first, with min 44px touch targets, rounded cards, soft shadows, orange primary buttons, green positive states, red over-budget states, and pastel chips.

Build these pages:
Login, Home, AddExpense, ScanReceipt, ReceiptResults, ItemDetail, ReportsBudget, BudgetSetup, CategoriesTags, FamilyMembers, SpendingBreakdown, Transactions, Settings.

Use mock data from Zustand store. Navigation must work through React Router.
```

---

## 17. Third prompt to paste into Codex

```text
Now build Phase 3 and Phase 4.

Add real local functionality using Zustand + localStorage:
- Create expense manually
- Edit/delete expense
- Add/edit/delete category
- Add/edit/delete tag
- Add/edit/delete family member
- Update budget limit and warning threshold
- Attach receipt image to manual expense using file input and preview
- Upload receipt image in Scan Receipt page
- Mock OCR/AI extraction after upload
- Create receipt and receipt items from mock AI result
- Allow editing each receipt item category, tag, member, and amount
- Confirm all receipt items to create expense records
- Item detail must open source receipt thumbnail/full viewer modal

Do not add backend or real OCR yet. Keep everything local and deterministic.
```

---

## 18. Fourth prompt to paste into Codex

```text
Now build Phase 5: reporting and budget logic.

Compute from actual local store data:
- Total spent by day/week/month
- Spending by category
- Spending by tag
- Spending by family member
- This month details list
- Budget status green/orange/red based on warning threshold and budget limit
- Reports & Budget dashboard
- Spending Breakdown page with larger touch-friendly rows and horizontal carousel sections for tags and members

Make sure all totals update when expenses or receipt items change.
```

---

## 19. Fifth prompt to paste into Codex

```text
Now build Phase 6: Milestone 2 Deal Watchlist UI and mock behavior.

Use UI references:
- 12-deal-watchlist-m2.png
- 13-todays-deal-report-m2.png
- 14-deal-cards-m2.png

Build:
- Deal Watchlist page
- Today’s Deal Report page
- Deal Cards swipe-style page
- Shopping List page

Mock behavior:
- Watchlist items are saved locally.
- mockRunDailyDealCheck creates or updates today's deals.
- Deals have statuses: new, added_to_shopping_list, skipped, keep_watching.
- In Deal Cards, X means skip for today but keep in watchlist.
- Keep Watching means keep it on the watchlist.
- Check means add to today's shopping list.

No real web search or scraping yet. Add comments showing where a future agent/web-search integration should connect.
```

---

## 20. Definition of Done

MVP 1.0 is done when:

```text
App runs locally with npm run dev
All MVP routes work
All MVP pages are mobile-friendly
User can add expenses
User can attach receipt image
User can upload receipt and get mock OCR items
User can edit OCR item category/tag/member
User can confirm receipt items
Reports update from data
Budget ring changes green/orange/red
Categories/tags/family members can be managed
Settings page exists
Data persists after refresh
```

Milestone 2 UI is done when:

```text
Deal Watchlist page works with mock watchlist items
Today’s Deal Report shows mock discounts
Deal Cards support skip / keep watching / add to shopping list
Shopping list stores selected deal items
```
