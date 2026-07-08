import { useState, useEffect } from 'react'
import { Download, FileJson, FileSpreadsheet, FileText, Trash2, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/appStore'
import { formatDate, formatDateTime, monthLabel } from '@/utils/dates'

type ExportRecord = {
  id: string
  type: 'csv' | 'html' | 'json'
  timestamp: string
  fileName: string
  size: string
}

type StoredExportRecord = Omit<ExportRecord, 'type'> & {
  type: ExportRecord['type'] | 'pdf'
}

function loadExportHistory(): ExportRecord[] {
  try {
    const saved = localStorage.getItem('exportHistory')
    if (!saved) return []
    const parsed = JSON.parse(saved) as StoredExportRecord[]
    return Array.isArray(parsed)
      ? parsed.map((record) => ({ ...record, type: record.type === 'pdf' ? 'html' : record.type }))
      : []
  } catch {
    localStorage.removeItem('exportHistory')
    return []
  }
}

export function DataExport() {
  const expenses = useStore((s) => s.expenses)
  const receipts = useStore((s) => s.receipts)
  const receiptItems = useStore((s) => s.receiptItems)
  const categories = useStore((s) => s.categories)
  const tags = useStore((s) => s.tags)
  const familyMembers = useStore((s) => s.familyMembers)
  const budget = useStore((s) => s.budget)
  const settings = useStore((s) => s.settings)
  const incomeSources = useStore((s) => s.incomeSources)
  const incomeItems = useStore((s) => s.incomeItems)
  const ongoingIncomes = useStore((s) => s.ongoingIncomes)
  const budgetGoals = useStore((s) => s.budgetGoals)
  const recurringTransactions = useStore((s) => s.recurringTransactions)
  const spendingAlerts = useStore((s) => s.spendingAlerts)
  const watchlistItems = useStore((s) => s.watchlistItems)
  const deals = useStore((s) => s.deals)
  const shoppingList = useStore((s) => s.shoppingList)

  const [exportHistory, setExportHistory] = useState<ExportRecord[]>(loadExportHistory)

  const [exporting, setExporting] = useState<ExportRecord['type'] | null>(null)

  useEffect(() => {
    localStorage.setItem('exportHistory', JSON.stringify(exportHistory))
  }, [exportHistory])

  // Get current month's expenses
  const getCurrentMonthExpenses = () => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return expenses.filter((e) => {
      const d = new Date(e.date)
      return d >= startDate && d <= endDate
    })
  }

  // CSV Export - All transactions
  const exportAsCSV = () => {
    setExporting('csv')
    try {
      const headers = ['Date', 'Merchant', 'Amount', 'Category', 'Tags', 'Family Member', 'Notes', 'Source']
      const rows = expenses.map((e) => [
        e.date,
        e.merchant,
        e.amount.toFixed(2),
        categories.find((c) => c.id === e.categoryId)?.name || 'Unknown',
        e.tagIds.map((tid) => tags.find((t) => t.id === tid)?.name || '').join('; '),
        familyMembers.find((m) => m.id === e.memberId)?.name || 'N/A',
        e.notes || '',
        e.source,
      ])

      const csv = [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const str = String(cell)
              // Escape quotes and wrap in quotes if contains comma, newline, or quotes
              if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`
              }
              return str
            })
            .join(','),
        )
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      downloadFile(blob, `transactions_${new Date().toISOString().split('T')[0]}.csv`)

      addToHistory(
        'csv',
        `transactions_${new Date().toISOString().split('T')[0]}.csv`,
        (blob.size / 1024).toFixed(1),
      )
    } finally {
      setExporting(null)
    }
  }

  const exportAsHtmlReport = () => {
    setExporting('html')
    try {
      const monthExpenses = getCurrentMonthExpenses()

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Monthly Report - ${monthLabel(new Date().toISOString())}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .summary-item { display: flex; justify-content: space-between; margin: 8px 0; }
          </style>
        </head>
            <body>
          <h1>Monthly Expense Report</h1>
          <p style="text-align: center; color: #666;">${monthLabel(new Date().toISOString())}</p>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Member</th>
              </tr>
            </thead>
            <tbody>
              ${monthExpenses
                .map(
                  (e) => `
                <tr>
                  <td>${e.date}</td>
                  <td>${e.merchant}</td>
                  <td>$${e.amount.toFixed(2)}</td>
                  <td>${categories.find((c) => c.id === e.categoryId)?.name || 'Unknown'}</td>
                  <td>${familyMembers.find((m) => m.id === e.memberId)?.name || 'N/A'}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3 style="margin-top: 0;">Summary</h3>
            <div class="summary-item">
              <span>Total Transactions:</span>
              <span>${monthExpenses.length}</span>
            </div>
            <div class="summary-item">
              <span>Total Spent:</span>
              <span>$${monthExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</span>
            </div>
            ${
              monthExpenses.length > 0
                ? `<div class="summary-item">
                <span>Average Transaction:</span>
                <span>$${(monthExpenses.reduce((sum, e) => sum + e.amount, 0) / monthExpenses.length).toFixed(2)}</span>
              </div>`
                : ''
            }
          </div>

          <p style="margin-top: 40px; color: #999; font-size: 12px; text-align: center;">
            Generated on ${formatDateTime(new Date().toISOString())}
          </p>
        </body>
        </html>
      `

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
      downloadFile(blob, `monthly_report_${new Date().toISOString().split('T')[0]}.html`)

      addToHistory(
        'html',
        `monthly_report_${new Date().toISOString().split('T')[0]}.html`,
        (blob.size / 1024).toFixed(1),
      )
    } finally {
      setExporting(null)
    }
  }

  // JSON Backup - Complete data
  const exportAsJSON = () => {
    setExporting('json')
    try {
      const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          expenses,
          receipts,
          receiptItems,
          categories,
          tags,
          familyMembers,
          budget,
          settings,
          incomeSources,
          incomeItems,
          ongoingIncomes,
          budgetGoals,
          recurringTransactions,
          spendingAlerts,
          watchlistItems,
          deals,
          shoppingList,
        },
        summary: {
          totalExpenses: expenses.length,
          totalReceipts: receipts.length,
          totalIncomeItems: incomeItems.length,
          totalShoppingItems: shoppingList.length,
          totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
          dateRange:
            expenses.length > 0 ? `${expenses[expenses.length - 1].date} to ${expenses[0].date}` : 'N/A',
        },
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8;' })
      downloadFile(blob, `budget_backup_${new Date().toISOString().split('T')[0]}.json`)

      addToHistory(
        'json',
        `budget_backup_${new Date().toISOString().split('T')[0]}.json`,
        (blob.size / 1024).toFixed(1),
      )
    } finally {
      setExporting(null)
    }
  }

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const addToHistory = (type: ExportRecord['type'], fileName: string, size: string) => {
    const record: ExportRecord = {
      id: `${Date.now()}`,
      type,
      timestamp: new Date().toISOString(),
      fileName,
      size: `${size} KB`,
    }
    setExportHistory((prev) => [record, ...prev].slice(0, 20))
  }

  const clearHistory = () => {
    setExportHistory([])
  }

  const deleteHistoryItem = (id: string) => {
    setExportHistory((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Export Data" showBack />}>
      {/* Export Options */}
      <div className="space-y-4">
        <h2 className="px-1 text-[15px] font-bold text-ink">Export Options</h2>

        {/* CSV Export */}
        <Card
          className="cursor-pointer active:bg-surfaceSoft"
          onClick={exportAsCSV}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue/10">
              <FileSpreadsheet size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-ink">Export as CSV</h3>
              <p className="text-[13px] text-muted">All transactions (spreadsheet format)</p>
              <p className="mt-1 text-[12px] font-semibold text-blue-600">{expenses.length} transactions</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                exportAsCSV()
              }}
              disabled={exporting === 'csv'}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line transition-colors active:bg-surfaceSoft disabled:opacity-50"
            >
              <Download size={18} className={exporting === 'csv' ? 'animate-bounce' : ''} />
            </button>
          </div>
        </Card>

        {/* HTML Report Export */}
        <Card
          className="cursor-pointer active:bg-surfaceSoft"
          onClick={exportAsHtmlReport}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red/10">
              <FileText size={24} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-ink">Export Monthly Report</h3>
              <p className="text-[13px] text-muted">Current month report (HTML)</p>
              <p className="mt-1 text-[12px] font-semibold text-red-600">
                {getCurrentMonthExpenses().length} transactions this month
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                exportAsHtmlReport()
              }}
              disabled={exporting === 'html'}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line transition-colors active:bg-surfaceSoft disabled:opacity-50"
            >
              <Download size={18} className={exporting === 'html' ? 'animate-bounce' : ''} />
            </button>
          </div>
        </Card>

        {/* JSON Export */}
        <Card
          className="cursor-pointer active:bg-surfaceSoft"
          onClick={exportAsJSON}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green/10">
              <FileJson size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-ink">Export as JSON</h3>
              <p className="text-[13px] text-muted">Complete backup of app data</p>
              <p className="mt-1 text-[12px] font-semibold text-green-600">Full data backup</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                exportAsJSON()
              }}
              disabled={exporting === 'json'}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line transition-colors active:bg-surfaceSoft disabled:opacity-50"
            >
              <Download size={18} className={exporting === 'json' ? 'animate-bounce' : ''} />
            </button>
          </div>
        </Card>
      </div>

      {/* Export History */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-muted" />
            <h2 className="text-[15px] font-bold text-ink">Export History</h2>
          </div>
          {exportHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-[12px] font-semibold text-red-600 active:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>

        {exportHistory.length === 0 ? (
          <Card soft>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Clock size={32} className="text-line" />
              <p className="text-[14px] font-semibold text-muted">No exports yet</p>
              <p className="text-[12px] text-muted">Your export history will appear here</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {exportHistory.map((item) => (
              <Card key={item.id} className="flex items-center gap-3 px-4 py-3">
                {item.type === 'csv' && <FileSpreadsheet size={20} className="text-blue-600" />}
                {item.type === 'html' && <FileText size={20} className="text-red-600" />}
                {item.type === 'json' && <FileJson size={20} className="text-green-600" />}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{item.fileName}</p>
                  <p className="text-[11px] text-muted">
                    {formatDateTime(item.timestamp)} • {item.size}
                  </p>
                </div>
                <button
                  onClick={() => deleteHistoryItem(item.id)}
                  className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red/10 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <Card soft className="mt-8 space-y-2">
        <h3 className="text-[13px] font-bold text-ink">About Exports</h3>
        <ul className="space-y-1 text-[12px] text-muted">
          <li>• CSV: Open in Excel or Google Sheets for analysis</li>
          <li>• HTML: Monthly summary with totals and averages</li>
          <li>• JSON: Complete backup of app data</li>
          <li>• History shows your last 20 exports</li>
          <li>• Files are downloaded directly to your device</li>
        </ul>
      </Card>
    </AppShell>
  )
}
