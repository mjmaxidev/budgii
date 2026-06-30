# Budgii UX Flow Map

```mermaid
graph TD
    Start([App Start]) --> Login
    
    %% Auth Flow
    Login["🔐 Login"]
    Login -->|Email/Phone| Verification["✓ Verification"]
    Verification --> OnBoarding["🎯 OnBoarding<br/>4-step setup"]
    OnBoarding --> Home
    
    %% Main Hub
    Home["🏠 Home<br/>Budget Overview"]
    
    %% From Home
    Home --> Transactions
    Home --> SpendingBreakdown
    Home --> DealWatchlist
    Home --> Notifications
    
    %% Expense Entry Path
    Transactions["💳 Transactions<br/>Expense List"]
    Transactions --> AddExpense["➕ Add Expense<br/>Manual Entry"]
    Transactions --> ScanReceipt["📸 Scan Receipt"]
    
    AddExpense --> TransactionConfirm["✔️ Confirm<br/>Transaction"]
    TransactionConfirm --> Home
    
    ScanReceipt["📸 Scan Receipt"] --> ReceiptResults["📋 Receipt Results<br/>AI Review"]
    ReceiptResults --> TransactionConfirm
    
    %% Receipt History
    ReceiptHistory["📚 Receipt History"] --> ReceiptImageViewer["🖼️ Receipt Viewer"]
    ReceiptImageViewer --> ReceiptHistory
    
    %% Reports & Analytics
    ReportsBudget["📊 Reports"]
    SpendingBreakdown["📉 Spending Breakdown<br/>Category Breakdown"]
    SpendingBreakdown --> Transactions
    ReportsBudget --> SpendingBreakdown
    ReportsBudget --> BudgetSetup["💰 Budget Setup<br/>Monthly Budget"]
    
    %% Budget Comparison
    BudgetComparison["📈 Budget Comparison<br/>Period Analysis"]
    
    %% Deals & Shopping
    DealWatchlist["⭐ Deal Watchlist"]
    DealWatchlist --> DealCards["🎴 Deal Cards<br/>Swipe View"]
    DealWatchlist --> TodaysDealReport["🎁 Today's Deals"]
    
    DealCards --> ShoppingList["🛒 Shopping List"]
    TodaysDealReport --> DealCards
    ShoppingList --> DealWatchlist
    
    %% Categories & Tags
    CategoriesTags["🏷️ Categories/Tags"]
    CategoryCreation["➕ Create Category"]
    TagCreation["➕ Create Tag"]
    
    CategoryCreation --> CategoriesTags
    TagCreation --> CategoriesTags
    
    %% Recurring & Income
    RecurringTransactions["🔄 Recurring Transactions"]
    IncomeTracking["💵 Income Tracking"]
    
    %% Alerts & Notifications
    SpendingAlerts["🔔 Spending Alerts"]
    Notifications["📬 Notifications"]
    
    %% User Settings
    Profile["👤 Profile"]
    Settings["⚙️ Settings"]
    FamilyMembers["👨‍👩‍👧 Family Members"]
    FamilyInvitation["📧 Family Invitation"]
    
    Profile --> Login
    Settings --> Login
    FamilyMembers --> Settings
    
    %% Support & Data
    Help["❓ Help & Support"]
    DataExport["📥 Data Export"]
    MonthlySummary["📅 Monthly Summary"]
    
    %% Styling
    classDef auth fill:#FF6A00,stroke:#333,color:#fff
    classDef hub fill:#1A3B2E,stroke:#333,color:#fff
    classDef expense fill:#16A34A,stroke:#333,color:#fff
    classDef report fill:#0284C7,stroke:#333,color:#fff
    classDef deals fill:#DC2626,stroke:#333,color:#fff
    classDef settings fill:#7C3AED,stroke:#333,color:#fff
    classDef support fill:#6B7280,stroke:#333,color:#fff
    
    class Login,Verification,OnBoarding auth
    class Home hub
    class Transactions,AddExpense,ScanReceipt,ReceiptResults,TransactionConfirm,ReceiptHistory,ReceiptImageViewer expense
    class ReportsBudget,SpendingBreakdown,BudgetSetup,BudgetComparison,CategoriesTags,CategoryCreation,TagCreation,RecurringTransactions,IncomeTracking,SpendingAlerts,MonthlySummary report
    class DealWatchlist,DealCards,TodaysDealReport,ShoppingList deals
    class Profile,Settings,FamilyMembers,FamilyInvitation,Notifications settings
    class Help,DataExport support
```

## Flow Categories

### 🔐 Authentication (Entry Point)
- **Login** → Verification → OnBoarding → Home
- Purpose: User registration & account setup

### 🏠 Hub
- **Home** is the central dashboard
- Distributes to all major features
- Shows budget overview, spending progress

### 💳 Expense Tracking
- **Transactions** (list view) ↔ AddExpense / ScanReceipt
- TransactionConfirm → Home (completion)
- Receipt History for reference

### 📊 Reports & Budget
- **Reports** hub → Budget Setup, Spending Breakdown, Budget Comparison
- Categories/Tags management
- Recurring Transactions & Income Tracking
- Spending Alerts

### 🎁 Deals & Shopping
- **Deal Watchlist** → Deal Cards (swipe) → Shopping List
- Today's Deals report
- Circular navigation

### 👤 User Settings
- **Profile / Settings** → Family setup
- Login option (logout) on Profile & Settings pages
- Notifications hub

### ❓ Support
- Help, Data Export, Monthly Summary
- Standalone pages (no shown navigation)

## Key Insights

1. **Home is the Hub** — Most user journeys start or return here
2. **Two Entry Points**: 
   - New users: Login → Verification → OnBoarding
   - Returning users: Login → Home
3. **Isolated Cycles**:
   - Expense entry: Add/Scan → Confirm → Home
   - Deal browsing: Watchlist ↔ Cards ↔ Shopping List
4. **Hierarchical Settings**: Profile/Settings only navigate to login (logout)
5. **Linear Reports**: Reports → Setup/Breakdown (no return shown, rely on navigation)
