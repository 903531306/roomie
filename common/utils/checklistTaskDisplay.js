import { getDateStr, normalizeTaskDueDate, formatMoney, formatDate } from '../../pages/js/utils.js'
import { coalesce } from './coalesce.js'

export function getMemberAvatar(member) {
  if (!member) return ''
  return member.avatar || member.userHeadUrl || member.headUrl || member.userAvatar || ''
}

export function normalizeRoomMember(member) {
  return {
    ...member,
    label: member.nickname,
    id: member.userId,
    avatar: getMemberAvatar(member)
  }
}

export function findRoomMember(roomMembers, assigneeId) {
  if (assigneeId == null || assigneeId === '') return null
  return (roomMembers || []).find(
    (member) =>
      String(member.id) === String(assigneeId) ||
      String(member.userId) === String(assigneeId)
  ) || null
}

export function resolveAssignee(task, roomMembers = []) {
  const assigneeId = coalesce(task && task.assigneeId, task && task.assignee && task.assignee.id, null)
  const member = findRoomMember(roomMembers, assigneeId)
  const label =
    task?.assigneeNickname ||
    task?.actorName ||
    task?.assigneeName ||
    task?.assignee?.label ||
    task?.assignee?.nickname ||
    member?.label ||
    member?.nickname ||
    ''
  const avatar = task?.assigneeAvatar || getMemberAvatar(member) || getMemberAvatar(task?.assignee) || ''
  return {
    id: assigneeId,
    label,
    avatar,
    member: member || (assigneeId ? { id: assigneeId, label, avatar } : null)
  }
}

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return getDateStr(dt)
}

export function daysBetween(fromStr, toStr) {
  const [y1, m1, d1] = fromStr.split('-').map(Number)
  const [y2, m2, d2] = toStr.split('-').map(Number)
  const a = new Date(y1, m1 - 1, d1).getTime()
  const b = new Date(y2, m2 - 1, d2).getTime()
  return Math.max(1, Math.round((b - a) / 86400000))
}

export function getTaskBucket(task, overdueIds = new Set()) {
  const today = getDateStr(Date.now())
  const d = normalizeTaskDueDate(coalesce(task && task.dueDate, task && task.deadline))
  if (overdueIds.has(String(task.id)) || task?.isOverdue || (d && d < today)) return 'overdue'
  if (d === today) return 'today'
  if (task?.isUrgent == 1) return 'urgent'
  return 'normal'
}

export function getTaskDueDateDisplay(task, bucket) {
  const d = normalizeTaskDueDate(coalesce(task && task.dueDate, task && task.deadline))
  if (!d || bucket === 'today') return ''
  return `截止 ${d}`
}

export function isTaskOverdue(task, overdueIds = new Set()) {
  const today = getDateStr(Date.now())
  const d = normalizeTaskDueDate(coalesce(task && task.dueDate, task && task.deadline))
  return overdueIds.has(String(task.id)) || (task && task.isOverdue) || (d && d < today)
}

export function getTaskScheduleLine(task, overdueIds = new Set(), isCompleted = false) {
  if (isCompleted) {
    return {
      scheduleLine: '',
      scheduleDatePart: '',
      showScheduleUrgent: false,
      isScheduleOverdue: false
    }
  }

  const today = getDateStr(Date.now())
  const d = normalizeTaskDueDate(coalesce(task && task.dueDate, task && task.deadline))
  const isUrgent = task?.isUrgent == 1
  const overdue = d ? isTaskOverdue(task, overdueIds) : false
  const isToday = d === today

  let scheduleDatePart = ''
  if (overdue) scheduleDatePart = `逾期 · 截止 ${d}`
  else if (isToday) scheduleDatePart = '今天'
  else if (d) scheduleDatePart = `截止 ${d}`

  const parts = []
  if (isUrgent) parts.push('紧急')
  if (scheduleDatePart) parts.push(scheduleDatePart)

  return {
    scheduleLine: parts.join(' · '),
    scheduleDatePart,
    showScheduleUrgent: isUrgent,
    isScheduleOverdue: overdue
  }
}

export function getTaskDueDateLine(task, overdueIds = new Set(), isCompleted = false) {
  const schedule = getTaskScheduleLine(task, overdueIds, isCompleted)
  return {
    dueDateLine: schedule.scheduleLine,
    isDueDateOverdue: schedule.isScheduleOverdue
  }
}

export function getTaskSublineText(task, isCompleted = false) {
  const note = task?.description || task?.note
  if (note) return note.length > 18 ? `${note.slice(0, 18)}…` : note
  return ''
}

function formatCompletedLabel(task) {
  const raw = task?.completedAt
  if (!raw) return '完成 · 近期'
  const text = String(raw)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return `完成 · ${text.slice(0, 10)}`
  return text.length > 14 ? `完成 · ${text.slice(0, 14)}…` : `完成 · ${text}`
}

function hasLedgerValue(val) {
  return val != null && val !== ''
}

function toNumber(val) {
  const num = Number(val)
  return Number.isFinite(num) ? num : 0
}

function formatLedgerDate(rawTime) {
  if (rawTime == null || rawTime === '') return ''
  const text = String(rawTime)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  if (/^\d+$/.test(text)) return formatDate(Number(text), 'yyyy-MM-dd')
  return formatDate(text, 'yyyy-MM-dd')
}

export function normalizeLedgerRecord(record = {}) {
  const amount = toNumber(record.amount)
  const type = String(record.type || 'expense').toLowerCase()
  const signedAmount = type === 'expense'
    ? amount
    : (type === 'income' || type === 'refund' ? -amount : amount)

  return {
    id: coalesce(record.id, record.accountRecordId, record.ledgerId, record.recordId, null),
    title: coalesce(record.title, record.note, record.category, '账单'),
    amount,
    signedAmount,
    type,
    occurredAt: coalesce(record.occurredAt, record.entryTime, record.createdAt, record.date, null),
    dateDisplay: formatLedgerDate(coalesce(record.occurredAt, record.entryTime, record.createdAt, record.date)),
    amountDisplay: formatMoney(Math.abs(amount))
  }
}

function calcRecordedAmountFromRecords(records = []) {
  return records.reduce((sum, record) => sum + toNumber(coalesce(record.signedAmount, record.amount)), 0)
}

export function resolveTaskLedgerSummary(task) {
  const rawRecords = coalesce(task && task.ledgerRecords, task && task.accountRecords, task && task.ledgerList, [])
  let records = Array.isArray(rawRecords)
    ? rawRecords.map(normalizeLedgerRecord).filter((record) => record.id != null || record.amount > 0)
    : []

  const hasExplicitRecordCount =
    task?.recordCount != null ||
    task?.record_count != null ||
    task?.ledgerRecordCount != null

  let recordCount = toNumber(coalesce(task && task.recordCount, task && task.record_count, task && task.ledgerRecordCount, 0))
  let recordedAmount = coalesce(task && task.recordedAmount, task && task.recorded_amount, task && task.ledgerAmount)

  if (records.length > 0) {
    if (!recordCount) recordCount = records.length
    if (recordedAmount == null || recordedAmount === '') {
      recordedAmount = calcRecordedAmountFromRecords(records)
    }
  }

  // 旧接口兼容：仅在未返回 recordCount 时，用单笔记账字段兜底
  if (!hasExplicitRecordCount && !recordCount && hasLedgerValue(task?.ledgerTaskId)) {
    recordCount = 1
  }
  if ((recordedAmount == null || recordedAmount === '') && hasLedgerValue(task?.ledgerAmount)) {
    recordedAmount = task.ledgerAmount
  }
  if (recordCount === 1 && records.length === 0 && hasLedgerValue(task?.ledgerTaskId)) {
    records = [normalizeLedgerRecord({
      id: task.ledgerTaskId,
      amount: recordedAmount,
      type: 'expense',
      title: task.title,
      entryTime: task.ledgerEntryTime
    })]
  }

  recordCount = Math.max(0, Math.floor(toNumber(recordCount)))
  const hasRecordedAmount = recordedAmount != null && recordedAmount !== ''
  const amountNum = hasRecordedAmount ? toNumber(recordedAmount) : 0

  let ledgerPrimaryId = null
  if (recordCount === 1) {
    ledgerPrimaryId = coalesce(records[0] && records[0].id, task && task.ledgerTaskId, null)
  }

  return {
    recordCount,
    recordedAmount: amountNum,
    ledgerAmountDisplay: recordCount > 0 && hasRecordedAmount ? formatMoney(amountNum) : '',
    ledgerRecordLabel: recordCount > 1 ? `已记账 ${recordCount} 笔` : recordCount === 1 ? '已记账' : '',
    hasLedgerLink: recordCount > 0,
    hasLedgerRecordsDetail: records.length > 0,
    ledgerRecords: records,
    ledgerPrimaryId
  }
}

export function buildDisplayTask(task, options = {}) {
  const {
    roomMembers = [],
    overdueIds = new Set(),
    isCompleted = false,
    groupKey
  } = options
  const bucket = isCompleted ? 'completed' : getTaskBucket(task, overdueIds)
  const assignee = resolveAssignee(task, roomMembers)
  const resolvedGroupKey = groupKey || resolveActiveGroupKey(task, overdueIds)
  const ledgerSummary = resolveTaskLedgerSummary(task)
  const schedule = getTaskScheduleLine(task, overdueIds, isCompleted)
  const statusLabel = isCompleted ? formatCompletedLabel(task) : '进行中'
  return {
    ...task,
    bucket,
    groupKey: resolvedGroupKey,
    assigneeDisplayName: assignee.label,
    assigneeAvatar: assignee.avatar,
    dueDateDisplay: isCompleted ? '' : getTaskDueDateDisplay(task, bucket === 'today' ? 'today' : resolvedGroupKey === 'overdue' ? 'overdue' : bucket),
    dueDateLine: schedule.scheduleLine,
    scheduleLine: schedule.scheduleLine,
    scheduleDatePart: schedule.scheduleDatePart,
    showScheduleUrgent: schedule.showScheduleUrgent,
    isScheduleOverdue: schedule.isScheduleOverdue,
    isDueDateOverdue: schedule.isScheduleOverdue,
    sublineText: getTaskSublineText(task, isCompleted),
    showOverdueTag: false,
    showTodayTag: false,
    showUrgentTag: false,
    statusLabel,
    completedLabel: statusLabel,
    ...ledgerSummary,
    isCompleted
  }
}

export function resolveActiveGroupKey(task, overdueIds = new Set()) {
  const today = getDateStr(Date.now())
  const d = normalizeTaskDueDate(coalesce(task && task.dueDate, task && task.deadline))
  if (overdueIds.has(String(task.id)) || task?.isOverdue || (d && d < today)) return 'overdue'
  if (d === today) return 'today'
  if (d && d > today && d <= addDays(today, 7)) return 'week'
  return 'none'
}

export function getCurrentMonthKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function recordMatchesMonth(record, monthKey) {
  if (!monthKey) return true
  const dateText = record?.dateDisplay || formatLedgerDate(record?.occurredAt)
  if (!dateText) return true
  return dateText.startsWith(monthKey)
}

function pickApiRoomTaskLedger(apiPayload) {
  if (!apiPayload || typeof apiPayload !== 'object') return null
  return coalesce(
    apiPayload.taskLedgerSummary,
    apiPayload.taskLedger,
    apiPayload.ledgerBoard,
    apiPayload.checklistLedger,
    null
  )
}

function classifyLedgerAmount(type, amount) {
  const value = Math.abs(toNumber(amount))
  if (value <= 0) return { expense: 0, income: 0 }
  const normalizedType = String(type || 'expense').toLowerCase()
  if (normalizedType === 'income' || normalizedType === 'refund') {
    return { expense: 0, income: value }
  }
  return { expense: value, income: 0 }
}

function accumulateLedgerRecord(record, monthKey) {
  if (!recordMatchesMonth(record, monthKey)) {
    return { expense: 0, income: 0, count: 0 }
  }
  const split = classifyLedgerAmount(record.type, record.amount)
  return {
    expense: split.expense,
    income: split.income,
    count: split.expense > 0 || split.income > 0 ? 1 : 0
  }
}

function buildRoomTaskLedgerResult(recordCount, expense, income) {
  const count = Math.max(0, Math.floor(toNumber(recordCount)))
  const expenseTotal = Math.max(0, toNumber(expense))
  const incomeTotal = Math.max(0, toNumber(income))

  if (count <= 0 && expenseTotal <= 0 && incomeTotal <= 0) {
    return {
      visible: false,
      recordCount: 0,
      expense: 0,
      income: 0,
      expenseDisplay: '',
      incomeDisplay: '',
      netExpense: 0,
      netIncome: 0,
      netExpenseDisplay: '',
      netIncomeDisplay: '',
      primaryLine: '',
      secondaryLine: '',
      showSecondary: false,
      showCountInHeader: false,
      primaryTone: 'neutral',
      countLabel: ''
    }
  }

  const expenseDisplay = formatMoney(expenseTotal)
  const incomeDisplay = formatMoney(incomeTotal)
  const netExpense = Math.max(0, expenseTotal - incomeTotal)
  const netIncome = Math.max(0, incomeTotal - expenseTotal)
  const netExpenseDisplay = formatMoney(netExpense)
  const netIncomeDisplay = formatMoney(netIncome)

  let primaryLine = ''
  let primaryTone = 'neutral'
  let secondaryLine = ''
  let showSecondary = false

  if (expenseTotal > 0 && incomeTotal > 0) {
    if (expenseTotal >= incomeTotal) {
      primaryLine = `本月净支出 ¥${netExpenseDisplay}`
      primaryTone = 'net-expense'
    } else {
      primaryLine = `本月净收入 ¥${netIncomeDisplay}`
      primaryTone = 'net-income'
    }
    secondaryLine = `支出 ¥${expenseDisplay} · 收入 ¥${incomeDisplay}`
    showSecondary = true
  } else if (expenseTotal > 0) {
    primaryLine = `本月支出 ¥${expenseDisplay}`
    primaryTone = 'expense-only'
  } else if (incomeTotal > 0) {
    primaryLine = `本月收入 ¥${incomeDisplay}`
    primaryTone = 'income-only'
  }

  return {
    visible: true,
    recordCount: count,
    expense: expenseTotal,
    income: incomeTotal,
    expenseDisplay,
    incomeDisplay,
    netExpense,
    netIncome,
    netExpenseDisplay,
    netIncomeDisplay,
    primaryLine,
    secondaryLine,
    showSecondary,
    showCountInHeader: showSecondary,
    primaryTone,
    countLabel: `${count}笔`
  }
}

export function buildLedgerEntryView(summary) {
  if (!summary?.visible) return null

  const totalExpense = summary.expense
  const totalIncome = summary.income

  let netStatLabel = '净支出'
  let netStatAmount = summary.netExpenseDisplay || summary.expenseDisplay || '0.00'

  if (totalIncome > totalExpense) {
    netStatLabel = '净收入'
    netStatAmount = summary.netIncomeDisplay || formatMoney(totalIncome - totalExpense)
  } else if (summary.apiNetExpense != null) {
    netStatLabel = '净支出'
    netStatAmount = formatMoney(Math.abs(summary.apiNetExpense))
  }

  return {
    recordCount: summary.recordCount,
    netStatLabel,
    netStatAmount,
    expenseAmount: summary.expenseDisplay || '0.00',
    incomeAmount: summary.incomeDisplay || '0.00'
  }
}

export function normalizeTaskLedgerSummaryData(data) {
  if (!data || typeof data !== 'object') {
    return buildRoomTaskLedgerResult(0, 0, 0)
  }

  const recordCount = Math.max(0, Math.floor(toNumber(data.recordCount)))
  const expense = Math.max(0, toNumber(data.totalExpense))
  const income = Math.max(0, toNumber(data.totalIncome))
  const apiNetExpense = data.netExpense != null ? toNumber(data.netExpense) : null

  if (recordCount <= 0 && expense <= 0 && income <= 0) {
    return buildRoomTaskLedgerResult(0, 0, 0)
  }

  const result = buildRoomTaskLedgerResult(recordCount, expense, income)
  return {
    ...result,
    apiNetExpense
  }
}

function buildSignedAmountDisplay(type, amount) {
  const value = Math.abs(toNumber(amount))
  const normalizedType = String(type || 'expense').toLowerCase()
  const prefix = normalizedType === 'income' || normalizedType === 'refund' ? '+' : '-'
  return `${prefix}¥${formatMoney(value)}`
}

export function normalizeTaskLedgerRecord(row = {}) {
  const type = String(row.type || 'expense').toLowerCase()
  const amount = toNumber(row.amount)

  return {
    linkId: coalesce(row.linkId, null),
    taskId: coalesce(row.taskId, null),
    taskTitle: row.taskTitle || '清单',
    ledgerId: coalesce(row.ledgerId, null),
    id: coalesce(row.ledgerId, null),
    title: row.title || row.category || '账单',
    amount,
    type,
    category: row.category || '',
    amountDisplay: buildSignedAmountDisplay(type, amount),
    dateDisplay: formatLedgerDate(row.entryTime),
    entryTime: coalesce(row.entryTime, null)
  }
}

export function resolveRoomTaskLedgerSummary(options = {}) {
  const { tasks = [], apiPayload = null, monthKey = getCurrentMonthKey() } = options
  const apiSummary = pickApiRoomTaskLedger(apiPayload)
  if (apiSummary) {
    const recordCount = toNumber(coalesce(
      apiSummary.recordCount,
      apiSummary.totalRecords,
      apiSummary.count,
      apiSummary.record_count,
      0
    ))
    const expense = toNumber(coalesce(
      apiSummary.expense,
      apiSummary.totalExpense,
      apiSummary.total_expense,
      apiSummary.monthExpense,
      0
    ))
    const income = toNumber(coalesce(
      apiSummary.income,
      apiSummary.totalIncome,
      apiSummary.total_income,
      apiSummary.monthIncome,
      0
    ))
    if (recordCount > 0 || expense > 0 || income > 0) {
      return buildRoomTaskLedgerResult(recordCount, expense, income)
    }

    const legacyNet = toNumber(coalesce(
      apiSummary.netExpense,
      apiSummary.monthNetExpense,
      apiSummary.net_amount,
      apiSummary.recordedAmount,
      0
    ))
    if (recordCount > 0 || legacyNet > 0) {
      return buildRoomTaskLedgerResult(recordCount, legacyNet, 0)
    }
  }

  let totalRecords = 0
  let expenseTotal = 0
  let incomeTotal = 0

  for (const task of tasks) {
    const summary = resolveTaskLedgerSummary(task)
    if (summary.recordCount <= 0) continue

    const records = summary.ledgerRecords || []
    if (records.length > 0) {
      records.forEach((record) => {
        const part = accumulateLedgerRecord(record, monthKey)
        totalRecords += part.count
        expenseTotal += part.expense
        incomeTotal += part.income
      })
      continue
    }

    totalRecords += summary.recordCount
    expenseTotal += Math.max(0, summary.recordedAmount)
  }

  return buildRoomTaskLedgerResult(totalRecords, expenseTotal, incomeTotal)
}

export function buildTaskLinkedLedgerList(tasks = [], monthKey = getCurrentMonthKey()) {
  const entries = []

  for (const task of tasks) {
    const summary = resolveTaskLedgerSummary(task)
    if (summary.recordCount <= 0) continue

    const taskTitle = task?.title || '清单'
    const taskId = coalesce(task && task.id, null)
    const records = summary.ledgerRecords || []

    if (records.length > 0) {
      records.forEach((record) => {
        if (!recordMatchesMonth(record, monthKey)) return
        entries.push({
          id: record.id,
          title: record.title || taskTitle,
          amount: record.amount,
          type: record.type || 'expense',
          amountDisplay: buildSignedAmountDisplay(record.type, record.amount),
          taskId,
          taskTitle,
          occurredAt: record.occurredAt,
          dateDisplay: record.dateDisplay
        })
      })
      continue
    }

    entries.push({
      id: summary.ledgerPrimaryId,
      title: taskTitle,
      amount: summary.recordedAmount,
      type: 'expense',
      amountDisplay: buildSignedAmountDisplay('expense', summary.recordedAmount),
      taskId,
      taskTitle,
      occurredAt: coalesce(task && task.ledgerEntryTime, null),
      dateDisplay: formatLedgerDate(task?.ledgerEntryTime),
      recordCount: summary.recordCount
    })
  }

  return entries.sort((a, b) => {
    const left = a.dateDisplay || ''
    const right = b.dateDisplay || ''
    if (left && right) return right.localeCompare(left)
    if (left) return -1
    if (right) return 1
    return String(b.id || '').localeCompare(String(a.id || ''))
  })
}

export function isTaskCompleted(task) {
  if (!task) return false
  return !!(
    task.isCompleted ||
    task.isCompleted === 1 ||
    task.groupKey === 'completed' ||
    task.bucket === 'completed' ||
    task.status === 'completed' ||
    task.status === 1 ||
    task.status === '1'
  )
}

export function normalizeRoomTasksList(raw) {
  if (raw == null || raw === '') return []

  let parsed = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
  }

  if (Array.isArray(parsed)) return parsed.filter(Boolean)

  if (parsed && typeof parsed === 'object') {
    const nested =
      parsed.list ||
      parsed.rows ||
      parsed.tasks ||
      parsed.pending ||
      parsed.data

    if (Array.isArray(nested)) return nested.filter(Boolean)

    if (nested && typeof nested === 'object') {
      const inner = nested.list || nested.rows || nested.tasks
      if (Array.isArray(inner)) return inner.filter(Boolean)
    }

    if (parsed.title || parsed.taskTitle || parsed.id != null) return [parsed]
  }

  return []
}

export function mergePendingTaskLists(...lists) {
  const map = new Map()
  lists.flat().filter(Boolean).forEach((task) => {
    if (isTaskCompleted(task)) return
    const key = task.id != null
      ? String(task.id)
      : `${task.title || task.taskTitle || ''}-${task.createdAt || task.dueDate || ''}`
    if (!map.has(key)) map.set(key, task)
  })
  return Array.from(map.values())
}

export function getHomeTaskPreviewMeta(task) {
  if (task?.ledgerAmountDisplay) {
    return {
      text: `¥${task.ledgerAmountDisplay}`,
      type: 'ledger'
    }
  }
  if (task?.scheduleLine) {
    return {
      text: task.scheduleLine,
      type: task.showScheduleUrgent
        ? 'urgent'
        : (task.isScheduleOverdue ? 'overdue' : 'normal')
    }
  }
  return null
}

export function buildHomeChecklistPreview(tasksArray = []) {
  const pendingTasks = mergePendingTaskLists(tasksArray).sort((a, b) => {
    const left = a.isUrgent == 1 ? 0 : 1
    const right = b.isUrgent == 1 ? 0 : 1
    if (left !== right) return left - right
    return 0
  })

  const checklistStats = {
    pending: pendingTasks.length,
    urgent: pendingTasks.filter((task) => task.isUrgent == 1).length,
    overdue: pendingTasks.filter((task) => isTaskOverdue(task)).length
  }
  const previewTasks = pendingTasks.slice(0, 2).map((task) => {
    const display = buildDisplayTask(task)
    return {
      ...display,
      previewMeta: getHomeTaskPreviewMeta(display)
    }
  })

  return { checklistStats, previewTasks }
}
