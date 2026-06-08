<template>
  <view :class="themeClass" class="board-root">
    <block v-if="isLoading">
      <view class="toolbar-card sk-block shimmer" style="min-height: 52px;"></view>
      <view class="compose-bar sk-block shimmer" style="min-height: 72px;"></view>
      <view class="task-panel sk-block shimmer" style="min-height: 160px;"></view>
    </block>

    <block v-else>
      <!-- 单行指标工具栏 -->
      <view class="toolbar-card animate-fade-in">
        <view class="metrics-strip">
          <view class="metric-cell">
            <text class="m-val primary">{{ pendingCount }}</text>
            <text class="m-lbl">待办</text>
          </view>
          <view class="m-divider"></view>
          <view class="metric-cell">
            <text class="m-val urgent">{{ urgentCount }}</text>
            <text class="m-lbl">紧急</text>
          </view>
          <view class="m-divider"></view>
          <view class="metric-cell">
            <text class="m-val" :class="{ overdue: overdueCount > 0 }">{{ overdueCount }}</text>
            <text class="m-lbl">逾期</text>
          </view>
        </view>
        <view class="toolbar-actions">
          <view class="bell-anchor">
            <view class="tool-btn" @tap.stop="toggleReminders">
              <text class="tool-icon">🔔</text>
              <view v-if="hasUnread" class="unread-dot"></view>
            </view>
          </view>
          <view class="tool-btn text-btn" @tap="goToCenter">
            <text class="tool-label">全部</text>
          </view>
        </view>
      </view>

      <view
        v-if="ledgerEntryView"
        class="task-ledger-entry animate-slide-up"
        @tap="goToTaskLedger"
      >
        <view class="tle-top">
          <text class="tle-title">清单记账</text>
          <text class="tle-arrow">›</text>
        </view>
        <view class="tle-summary-grid">
          <view class="tle-summary-item">
            <text class="tle-summary-label">{{ ledgerEntryView.netStatLabel }}</text>
            <text class="tle-summary-amount primary">¥{{ ledgerEntryView.netStatAmount }}</text>
          </view>
          <view class="tle-summary-item">
            <text class="tle-summary-label">支出</text>
            <text class="tle-summary-amount expense">¥{{ ledgerEntryView.expenseAmount }}</text>
          </view>
          <view class="tle-summary-item">
            <text class="tle-summary-label">收入</text>
            <text class="tle-summary-amount income">¥{{ ledgerEntryView.incomeAmount }}</text>
          </view>
        </view>
        <text class="tle-summary-meta">{{ ledgerEntryView.recordCount }} 笔关联记账</text>
      </view>

      <ChecklistQuickAdd
        v-model="inputTitle"
        class="animate-slide-up"
        :loading="isAdding"
        :quick-today="quickToday"
        :quick-urgent="quickUrgent"
        :quick-assignee="quickAssignee"
        :assignee-label="assigneeChipLabel"
        @update:quickToday="quickToday = $event"
        @update:quickUrgent="quickUrgent = $event"
        @submit="handleQuickAdd"
        @more="triggerOpenDrawer(null)"
        @pickAssignee="showAssigneePicker = true"
      />

      <scroll-view scroll-y class="board-scroll" :show-scrollbar="false">
        <view class="board-scroll-inner">
          <view v-if="displayTasks.length > 0" class="task-panel animate-fade-in">
            <ChecklistTaskLine
              v-for="(task, idx) in displayTasks"
              :key="task.id"
              class="animate-stagger-in"
              :task="task"
              :room-id="roomId"
              :account-id="accountId"
              :completing-id="completingId"
              :complete-phase="completePhase"
              :completed="false"
              :is-last="idx === displayTasks.length - 1 && hiddenCount === 0"
              :more-icon="'›'"
              :stagger-index="idx"
              @tap="onTaskLineTap"
              @complete="onCompleteTask"
              @more="onTaskMoreTap"
              @ledger="onTaskLedgerTap"
            />

            <view v-if="hiddenCount > 0" class="panel-footer" @tap="goToCenter">
              <text>查看全部 {{ mergedPending.length }} 项</text>
              <text class="footer-arrow">›</text>
            </view>
          </view>

          <view v-else class="empty-inline animate-fade-in">
            <text class="empty-t">暂无待办，在上方添加一条吧</text>
          </view>

          <view class="center-link" @tap="goToCenter">
            <text class="link-title">清单中心</text>
            <text class="link-dot">·</text>
            <text class="link-sub">历史与搜索</text>
            <text class="link-arrow">›</text>
          </view>

          <view class="bottom-safe-spacer"></view>
        </view>
      </scroll-view>
    </block>

    <view v-if="showReminders" class="reminder-dismiss-mask" @tap="showReminders = false" @touchmove.stop.prevent></view>
    <view v-if="showReminders" class="reminder-card animate-dropdown" :style="reminderCardStyle" @tap.stop>
      <view class="popup-arrow" :style="reminderArrowStyle"></view>
      <view class="popup-header">
        <text class="p-title">最近提醒</text>
        <text class="p-clear" @tap.stop="clearReminders">全部已读</text>
      </view>
      <scroll-view scroll-y class="reminder-list" :show-scrollbar="false">
        <view v-for="(msg, i) in (notifications || [])" :key="i" class="reminder-item">
          <view class="r-dot" :class="{ unread: !msg.read }"></view>
          <view class="r-body">
            <text class="r-txt">{{ msg.nickName || '' }} {{ msg.message }}</text>
            <text class="r-time">{{ formatRelativeTime(msg.createdAt) }}</text>
          </view>
        </view>
        <view v-if="!notifications || notifications.length === 0" class="empty-notif">
          <text class="empty-notif-txt">暂无未读提醒</text>
        </view>
      </scroll-view>
    </view>

    <view v-if="ledgerPrompt" class="ledger-prompt-wrap animate-pop-in" @tap="dismissLedgerPrompt">
      <view class="ledger-prompt-card" @tap.stop>
        <view class="lp-icon">💰</view>
        <view class="lp-content">
          <text class="lp-h">顺手记一笔？</text>
          <text class="lp-p">「{{ ledgerPromptTitle }}」可能涉及消费</text>
        </view>
        <view class="lp-btn" @tap="goToAddEntry">去记账</view>
        <view class="lp-close" @tap="dismissLedgerPrompt">✕</view>
      </view>
    </view>

    <BottomPicker
      v-model="showAssigneePicker"
      title="选择经办人"
      layout="list"
      :options="roomMembers"
      :currentSelected="quickAssignee"
      @change="onQuickAssigneeChange"
    />
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass } = useAppTheme()

import { ref, onMounted, onUnmounted, computed, getCurrentInstance, nextTick } from 'vue'
import { roomApi, taskApi } from '../../common/api'
import { formatRelativeTime, getDateStr, normalizeTaskDueDate, toTaskDueDateTimestamp } from '../../pages/js/utils.js'
import {
  buildDisplayTask,
  buildLedgerEntryView,
  normalizeTaskLedgerSummaryData
} from '../../common/utils/checklistTaskDisplay.js'
import { coalesce, pickApiList } from '@/common/utils/coalesce.js'
import BottomPicker from '../common/BottomPicker.vue'
import ChecklistQuickAdd from '../checklist/ChecklistQuickAdd.vue'
import ChecklistTaskLine from '../checklist/ChecklistTaskLine.vue'

const DISPLAY_LIMIT = 8
const CONSUME_KEYWORDS = ['买', '购', '付', '费', '支', '花', '交', '定', '餐']

const props = defineProps({
  roomId: { type: [String, Number], default: '' },
  accountId: { type: [String, Number], default: '' }
})

const isLoading = ref(true)
const isAdding = ref(false)
const allPending = ref([])
const overdueList = ref([])
const taskLedgerSummaryData = ref(null)
const inputTitle = ref('')
const quickToday = ref(true)
const quickUrgent = ref(false)
const quickAssignee = ref(null)
const roomMembers = ref([])
const showAssigneePicker = ref(false)
const completingId = ref(null)
const completePhase = ref('')
const COMPLETE_SWEEP_MS = 560
const COMPLETE_DONE_MS = 480

const showReminders = ref(false)
const reminderCardStyle = ref({})
const reminderArrowStyle = ref({})
const notifications = ref([])
const hasUnread = computed(() => (notifications.value || []).some(n => !n.read))
const instance = getCurrentInstance()

const ledgerPrompt = ref(false)
const ledgerPromptTitle = ref('')
const ledgerPromptTaskId = ref(null)
let ledgerHideTimer = null

const overdueIdSet = computed(() => new Set(overdueList.value.map(t => String(t.id))))

const mergedPending = computed(() => {
  const map = new Map()
  overdueList.value.forEach(task => map.set(String(task.id), task))
  allPending.value.forEach(task => {
    const key = String(task.id)
    if (!map.has(key)) map.set(key, task)
  })
  return Array.from(map.values())
})

const pendingCount = computed(() => mergedPending.value.length)
const urgentCount = computed(() => mergedPending.value.filter(t => t.isUrgent == 1).length)
const overdueCount = computed(() => overdueList.value.length)

const sortedPending = computed(() => {
  const ids = overdueIdSet.value
  return [...mergedPending.value].sort((a, b) => taskPriority(a, ids) - taskPriority(b, ids))
})

const displayTasks = computed(() =>
  sortedPending.value.slice(0, DISPLAY_LIMIT).map((task) =>
    buildDisplayTask(task, {
      roomMembers: roomMembers.value,
      overdueIds: overdueIdSet.value,
      isCompleted: false
    })
  )
)

const hiddenCount = computed(() => Math.max(0, mergedPending.value.length - DISPLAY_LIMIT))

const roomTaskLedger = computed(() =>
  normalizeTaskLedgerSummaryData(taskLedgerSummaryData.value)
)

const ledgerEntryView = computed(() => buildLedgerEntryView(roomTaskLedger.value))

const assigneeChipLabel = computed(() => {
  if (!quickAssignee.value) return '经办人'
  const label = quickAssignee.value.label || quickAssignee.value.nickname || '已选'
  return label.length > 4 ? label.slice(0, 4) + '…' : label
})

function getTodayStr() {
  return getDateStr(Date.now())
}

function findRoomMember(assigneeId) {
  if (assigneeId == null || assigneeId === '') return null
  return roomMembers.value.find(
    (member) =>
      String(member.id) === String(assigneeId) ||
      String(member.userId) === String(assigneeId)
  ) || null
}

function getTaskAssigneeName(task) {
  if (!task) return ''
  const directName =
    task.assigneeNickname ||
    task.actorName ||
    task.assigneeName ||
    task.assignee?.label ||
    task.assignee?.nickname ||
    ''
  if (directName) return directName

  const assigneeId = coalesce(task.assigneeId, task.assignee && task.assignee.id)
  const member = findRoomMember(assigneeId)
  return member?.label || member?.nickname || ''
}

function getMemberAvatar(member) {
  if (!member) return ''
  return member.avatar || member.userHeadUrl || member.headUrl || member.userAvatar || ''
}

function buildLocalTaskItem(source = {}, overrides = {}) {
  const assignee = coalesce(overrides.assignee, source.assignee)
  const assigneeId = coalesce(overrides.assigneeId, assignee && assignee.id, source.assigneeId)
  const member = findRoomMember(assigneeId)
  return {
    ...source,
    ...overrides,
    assigneeId: coalesce(assigneeId, null),
    assigneeNickname:
      overrides.assigneeNickname ||
      assignee?.label ||
      member?.label ||
      source.assigneeNickname ||
      source.actorName ||
      ''
  }
}

function getTaskDueDateDisplay(task, bucket = 'normal') {
  const d = normalizeTaskDueDate(coalesce(task.dueDate, task.deadline))
  if (!d || bucket === 'today') return ''
  if (bucket === 'overdue') return `截止 ${d}`
  return `截止 ${d}`
}

function getTaskSublineText(task) {
  const note = task.description || task.note
  if (note) {
    return note.length > 18 ? note.slice(0, 18) + '…' : note
  }
  if (!normalizeTaskDueDate(coalesce(task.dueDate, task.deadline))) {
    return '日常待办'
  }
  return ''
}

function isOverdue(task) {
  if (task.isOverdue) return true
  const d = normalizeTaskDueDate(coalesce(task.dueDate, task.deadline))
  return d && d < getTodayStr()
}

function isToday(task) {
  const d = normalizeTaskDueDate(coalesce(task.dueDate, task.deadline))
  return d === getTodayStr()
}

function taskPriority(task, overdueIds) {
  if (overdueIds.has(String(task.id)) || isOverdue(task)) return 0
  if (isToday(task)) return 1
  if (task.isUrgent == 1) return 2
  return 3
}

function getTaskBucket(task, ids) {
  if (ids.has(String(task.id)) || isOverdue(task)) return 'overdue'
  if (isToday(task)) return 'today'
  if (task.isUrgent == 1) return 'urgent'
  return 'normal'
}

function formatTaskMeta(task) {
  const d = normalizeTaskDueDate(coalesce(task.dueDate, task.deadline))
  if (task.bucket === 'overdue') return d ? `截止 ${d}` : '已逾期'
  if (d) return d === getTodayStr() ? `今天 · ${d}` : `截止 ${d}`
  if (task.description || task.note) {
    const note = task.description || task.note
    return note.length > 18 ? note.slice(0, 18) + '…' : note
  }
  return '日常待办'
}

function looksLikeConsume(title) {
  return CONSUME_KEYWORDS.some(k => title.includes(k))
}

function resetQuickOptions() {
  quickToday.value = true
  quickUrgent.value = false
  quickAssignee.value = null
}

function updateReminderPosition() {
  nextTick(() => {
    uni.createSelectorQuery()
      .in(instance)
      .select('.bell-anchor')
      .boundingClientRect((rect) => {
        if (!rect) return
        const sys = uni.getSystemInfoSync()
        const margin = 20
        const cardW = sys.windowWidth - margin * 2
        const bellCenterX = rect.left + rect.width / 2
        reminderCardStyle.value = {
          position: 'fixed',
          top: `${rect.bottom + 10}px`,
          left: `${margin}px`,
          width: `${cardW}px`,
          boxSizing: 'border-box'
        }
        reminderArrowStyle.value = {
          left: `${Math.max(12, Math.min(cardW - 26, bellCenterX - margin - 7))}px`,
          right: 'auto'
        }
      })
      .exec()
  })
}

function toggleReminders() {
  if (showReminders.value) {
    showReminders.value = false
    return
  }
  showReminders.value = true
  updateReminderPosition()
}

async function loadTaskLedgerSummary() {
  if (!props.roomId) return
  try {
    const res = await taskApi.taskLedgerSummary({ roomId: props.roomId })
    if (res?.code == 0) {
      taskLedgerSummaryData.value = res.data || null
    }
  } catch (e) {
    taskLedgerSummaryData.value = null
  }
}

function handleTaskLedgerRefresh(refreshRoomId) {
  if (!props.roomId) return
  if (refreshRoomId && String(refreshRoomId) !== String(props.roomId)) return
  loadTaskLedgerSummary()
}

async function loadBoardData(silent = false) {
  if (!silent) isLoading.value = true
  try {
    const [listRes, allRes] = await Promise.all([
      taskApi.getTaskList({ roomId: props.roomId }),
      taskApi.taskAllList({ roomId: props.roomId })
    ])
    if (listRes?.code == 0) {
      allPending.value = listRes.data?.rows || listRes.data?.list || []
    }
    if (allRes?.code == 0) {
      const pending = pickApiList(allRes.data, 'pending')
      const overdue = pickApiList(allRes.data, 'overdue')
      if (pending.length) allPending.value = pending
      overdueList.value = Array.isArray(overdue) ? overdue : []
    }
    await loadTaskLedgerSummary()
  } finally {
    if (!silent) isLoading.value = false
  }
}

async function loadMembers() {
  try {
    const res = await roomApi.getRoomMembers({ roomId: props.roomId })
    if (res.code == 0) {
      roomMembers.value = (res.data || []).map(m => ({
        ...m,
        label: m.nickname,
        id: m.userId,
        avatar: getMemberAvatar(m)
      }))
    }
  } catch (e) {}
}

function onTaskSaved(task) {
  if (task.id) updateTask(task)
  else addTask(task)
}

function onTaskDeleted(id) {
  allPending.value = allPending.value.filter(t => t.id !== id)
  overdueList.value = overdueList.value.filter(t => t.id !== id)
}

function refreshBoard() {
  if (!props.roomId) return
  loadBoardData(true)
  getNotificationList()
}

onMounted(() => {
  loadBoardData()
  loadMembers()
  getNotificationList()
  uni.$on('checklist_task_saved', onTaskSaved)
  uni.$on('checklist_task_deleted', onTaskDeleted)
  uni.$on('checklist_board_refresh', refreshBoard)
  uni.$on('task_ledger_refresh', handleTaskLedgerRefresh)
})

onUnmounted(() => {
  uni.$off('checklist_task_saved', onTaskSaved)
  uni.$off('checklist_task_deleted', onTaskDeleted)
  uni.$off('checklist_board_refresh', refreshBoard)
  uni.$off('task_ledger_refresh', handleTaskLedgerRefresh)
  if (ledgerHideTimer) clearTimeout(ledgerHideTimer)
})

const goToCenter = () => {
  uni.navigateTo({
    url: `/pages/checklist-center/checklist-center?roomId=${props.roomId}&accountId=${props.accountId}`
  })
}

const goToTaskLedger = () => {
  if (!ledgerEntryView.value) return
  uni.navigateTo({
    url: `/pages/ledger-all/ledger-all?roomId=${props.roomId}&accountId=${props.accountId}`
  })
}

const getNotificationList = async () => {
  const res = await taskApi.notificationList({ roomId: props.roomId })
  if (res.code == 0) notifications.value = res.data || []
}

const updateTask = async (task) => {
  const isUrgentVal = task.isUrgent ? 1 : 0
  const dueDateStr = normalizeTaskDueDate(coalesce(task.dueDate, task.deadline))
  const map = {
    id: task.id,
    title: task.title,
    isUrgent: isUrgentVal,
    assigneeId: task.assignee?.id || task.assigneeId,
    description: task.note || task.description,
    dueDate: dueDateStr ? toTaskDueDateTimestamp(dueDateStr) : undefined,
    roomId: props.roomId
  }
  try {
    const res = await taskApi.updateTask(map)
    if (res.code == 0) {
      const idx = allPending.value.findIndex(t => t.id === task.id)
      if (idx > -1) {
        allPending.value[idx] = buildLocalTaskItem(allPending.value[idx], {
          ...task,
          isUrgent: isUrgentVal,
          description: map.description,
          dueDate: coalesce(res.data && res.data.dueDate, map.dueDate),
          assigneeId: task.assignee?.id || task.assigneeId,
          assigneeNickname: task.assignee?.label || allPending.value[idx].assigneeNickname
        })
        const overdueIdx = overdueList.value.findIndex(t => t.id === task.id)
        if (overdueIdx > -1) {
          overdueList.value[overdueIdx] = {
            ...overdueList.value[overdueIdx],
            ...allPending.value[idx]
          }
        }
      } else {
        loadBoardData()
      }
      getNotificationList()
    }
  } catch (e) {}
}

const handleQuickAdd = async () => {
  if (!inputTitle.value.trim() || isAdding.value) return
  isAdding.value = true
  await addTask(null)
}

const addTask = async (taskData) => {
  try {
    const title = taskData?.title || inputTitle.value.trim()
    if (!title) return
    const isUrgent = taskData?.isUrgent ? 1 : quickUrgent.value ? 1 : 0
    const assignee = taskData?.assignee || quickAssignee.value
    const dueDateStr =
      normalizeTaskDueDate(coalesce(taskData && taskData.dueDate, taskData && taskData.deadline)) ||
      (quickToday.value ? getTodayStr() : '')
    const map = {
      roomId: props.roomId,
      title,
      isUrgent,
      assigneeId: assignee?.id,
      description: taskData?.note || taskData?.description,
      actorName: assignee?.label || '',
      dueDate: dueDateStr ? toTaskDueDateTimestamp(dueDateStr) : undefined
    }
    const res = await taskApi.createTask(map)
    if (res?.code == 0) {
      allPending.value.unshift(buildLocalTaskItem(res.data || {}, {
        id: res.data?.id || Date.now(),
        title: map.title,
        isUrgent,
        description: map.description,
        dueDate: coalesce(res.data && res.data.dueDate, map.dueDate),
        assigneeId: coalesce(assignee && assignee.id, res.data && res.data.assigneeId),
        assigneeNickname: assignee?.label || res.data?.assigneeNickname || map.actorName || '',
        note: taskData?.note || taskData?.description || ''
      }))
      inputTitle.value = ''
      resetQuickOptions()
      getNotificationList()
    }
  } finally {
    isAdding.value = false
  }
}

const clearReminders = async () => {
  if (!notifications.value?.length) return
  const res = await taskApi.notificationRead(notifications.value.map(n => n.id))
  if (res.code == 0) {
    notifications.value = []
    showReminders.value = false
  }
}

const triggerOpenDrawer = (task) => {
  uni.$emit(
    'open_checklist_drawer',
    task
      ? { ...task, note: task.description || task.note }
      : {
          title: inputTitle.value,
          isUrgent: quickUrgent.value,
          assignee: quickAssignee.value,
          dueDate: quickToday.value ? getTodayStr() : ''
        }
  )
}

const triggerOpenSheet = (task) => {
  uni.$emit('open_checklist_sheet', task)
}

const onQuickAssigneeChange = (item) => {
  quickAssignee.value = item
}

function isTaskCompleting(task) {
  return completingId.value === task?.id
}

function onTaskLineTap(task) {
  if (isTaskCompleting(task)) return
  triggerOpenDrawer(task)
}

function onTaskMoreTap(task) {
  if (isTaskCompleting(task)) return
  triggerOpenSheet(task)
}

function onTaskLedgerTap(task) {
  if (isTaskCompleting(task)) return
  uni.$emit('open_checklist_drawer', task)
}

function resetCompleteState() {
  completingId.value = null
  completePhase.value = ''
}

function waitMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function onCompleteTask(task) {
  if (isTaskCompleting(task)) return

  completingId.value = task.id
  completePhase.value = 'sweep'

  const apiPromise = taskApi.complateTask(task.id).catch(() => ({ code: -1 }))

  await waitMs(COMPLETE_SWEEP_MS)
  if (!isTaskCompleting(task)) return

  completePhase.value = 'done'
  await waitMs(COMPLETE_DONE_MS)
  if (!isTaskCompleting(task)) return

  try {
    const res = await apiPromise
    if (res.code == 0) {
      allPending.value = allPending.value.filter(t => t.id !== task.id)
      overdueList.value = overdueList.value.filter(t => t.id !== task.id)
      if (looksLikeConsume(task.title)) showLedgerPrompt(task)
    } else {
      uni.showToast({ title: '完成失败', icon: 'none' })
    }
  } finally {
    resetCompleteState()
  }
}

function showLedgerPrompt(task) {
  if (ledgerHideTimer) clearTimeout(ledgerHideTimer)
  ledgerPromptTitle.value = task?.title || ''
  ledgerPromptTaskId.value = task?.id || null
  ledgerPrompt.value = true
  ledgerHideTimer = setTimeout(() => {
    ledgerPrompt.value = false
    ledgerPromptTaskId.value = null
    ledgerHideTimer = null
  }, 6000)
}

function dismissLedgerPrompt() {
  if (ledgerHideTimer) clearTimeout(ledgerHideTimer)
  ledgerPrompt.value = false
  ledgerPromptTaskId.value = null
  ledgerHideTimer = null
}

const goToAddEntry = () => {
  const taskId = ledgerPromptTaskId.value
  const title = ledgerPromptTitle.value
  dismissLedgerPrompt()
  let url = `/pages/add-entry/add-entry?roomId=${props.roomId}&accountId=${props.accountId}`
  if (taskId) url += `&taskId=${taskId}`
  if (title) url += `&note=${encodeURIComponent(title)}`
  uni.navigateTo({ url })
}
</script>

<style scoped>
.board-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 0 16px;
  padding-top: 4px;
  overflow: hidden;
}

/* 单行工具栏 */
.toolbar-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 18px;
  padding: 10px 10px 10px 4px;
  margin-bottom: 10px;
  border: 1px solid #f1f5f9;
  position: relative;
  z-index: 1;
}
.metrics-strip {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}
.metric-cell {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  padding: 4px 0;
}
.m-val {
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
  color: #94a3b8;
}
.m-val.primary { color: var(--primary-color, #4f46e5); }
.m-val.urgent { color: #f43f5e; }
.m-val.overdue { color: #dc2626; }
.m-lbl {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}
.m-divider {
  width: 1px;
  height: 22px;
  background: #e2e8f0;
  flex-shrink: 0;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding-left: 6px;
  border-left: 1px solid #f1f5f9;
}
.bell-anchor { position: relative; z-index: 2001; }
.tool-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--primary-soft, #eef2ff);
  display: flex;
  align-items: center;
  justify-content: center;
}
.tool-btn.text-btn {
  width: auto;
  padding: 0 12px;
}
.tool-icon { font-size: 15px; }
.tool-label {
  font-size: 12px;
  font-weight: 800;
  color: var(--primary-color, #4f46e5);
}
.unread-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 7px;
  height: 7px;
  background: #f43f5e;
  border-radius: 50%;
  border: 1.5px solid #fff;
}

.task-ledger-entry {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  padding: 12px 14px 10px;
  margin-bottom: 10px;
  box-sizing: border-box;
}
.task-ledger-entry:active {
  background: #f8fafc;
}
.tle-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.tle-title {
  font-size: 14px;
  font-weight: 800;
  color: #1f2937;
}
.tle-arrow {
  font-size: 18px;
  line-height: 1;
  color: #cbd5e1;
  font-weight: 300;
}
.tle-summary-grid {
  display: flex;
  gap: 8px;
}
.tle-summary-item {
  flex: 1;
  min-width: 0;
}
.tle-summary-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 6px;
}
.tle-summary-amount {
  display: block;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
}
.tle-summary-amount.primary {
  color: #1f2937;
}
.tle-summary-amount.expense {
  color: #ef4444;
}
.tle-summary-amount.income {
  color: #059669;
}
.tle-summary-meta {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

/* 紧凑输入条（与抽屉 field-shell 聚焦态一致） */
.field-shell {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  box-sizing: border-box;
}
.field-shell-focus {
  border-color: var(--primary-color, #4f46e5);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
}
.compose-bar {
  padding: 10px 12px 8px;
  margin-bottom: 10px;
}
.compose-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.compose-input {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  height: 36px;
}
.compose-add {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.compose-add.on {
  background: var(--primary-color, #4f46e5);
}
.add-icon {
  font-size: 20px;
  font-weight: 300;
  color: #94a3b8;
  line-height: 1;
}
.compose-add.on .add-icon { color: #fff; font-weight: 400; }
.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.mini-spinner.dark {
  border-color: rgba(79, 70, 229, 0.2);
  border-top-color: var(--primary-color, #4f46e5);
}
@keyframes spin { to { transform: rotate(360deg); } }
.chip-scroll { width: 100%; white-space: nowrap; }
.chip-inner { display: flex; flex-direction: row; gap: 6px; padding-bottom: 2px; }
.chip {
  padding: 4px 12px;
  border-radius: 100px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.chip-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}
.chip.on {
  background: var(--primary-soft, #eef2ff);
  border-color: var(--primary-color, #4f46e5);
}
.chip.on .chip-label { color: var(--primary-color, #4f46e5); }
.chip-urgent.on {
  background: #fff1f2;
  border-color: #fecdd3;
}
.chip-urgent.on .chip-label { color: #f43f5e; }
.chip-ghost { background: transparent; border-style: dashed; }

.board-scroll { flex: 1; height: 0; z-index: 1; }

.task-panel {
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #f1f5f9;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px;
  background: #f8fafc;
}
.panel-footer text {
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-color, #4f46e5);
}
.footer-arrow { opacity: 0.6; }

.empty-inline {
  padding: 28px 16px;
  text-align: center;
  background: #fff;
  border-radius: 16px;
  border: 1px dashed #e2e8f0;
}
.empty-t { font-size: 13px; font-weight: 600; color: #94a3b8; }

.center-link {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 0;
}
.link-title { font-size: 13px; font-weight: 800; color: #64748b; }
.link-dot { color: #cbd5e1; font-size: 12px; }
.link-sub { font-size: 12px; font-weight: 600; color: #94a3b8; }
.link-arrow { font-size: 14px; color: var(--primary-color, #4f46e5); margin-left: 2px; }
.center-link:active { opacity: 0.7; }

.bottom-safe-spacer { height: 72px; }
.reminder-dismiss-mask { position: fixed; inset: 0; z-index: 2000; }
.reminder-card {
  position: fixed;
  background: #fff;
  border-radius: 16px;
  padding: 18px 16px;
  border: 1px solid var(--primary-soft, #eef2ff);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  z-index: 2002;
  box-sizing: border-box;
}
.popup-arrow {
  position: absolute;
  top: -8px;
  width: 14px;
  height: 14px;
  background: #fff;
  transform: rotate(45deg);
  border-left: 1px solid var(--primary-soft, #eef2ff);
  border-top: 1px solid var(--primary-soft, #eef2ff);
}
.popup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.p-title { font-size: 14px; font-weight: 900; color: #1e293b; }
.p-clear { font-size: 11px; font-weight: 700; color: var(--primary-color, #4f46e5); }
.reminder-list { max-height: 260px; }
.reminder-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.reminder-item:last-child { border-bottom: none; }
.r-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
.r-dot.unread { background: var(--primary-color, #4f46e5); }
.r-body { flex: 1; min-width: 0; }
.r-txt { font-size: 12px; font-weight: 700; color: #334155; line-height: 1.4; }
.r-time { font-size: 10px; color: #94a3b8; display: block; margin-top: 2px; }
.empty-notif { padding: 16px 0; text-align: center; }
.empty-notif-txt { font-size: 12px; color: #cbd5e1; font-weight: 700; }
.ledger-prompt-wrap { position: fixed; left: 20px; right: 20px; bottom: 100px; z-index: 3000; }
.ledger-prompt-card {
  background: #1e293b;
  border-radius: 22px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.22);
  position: relative;
}
.lp-icon { font-size: 24px; flex-shrink: 0; }
.lp-content { flex: 1; min-width: 0; }
.lp-h { font-size: 15px; font-weight: 900; color: #fff; display: block; }
.lp-p {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  display: block;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lp-btn {
  background: var(--primary-color, #4f46e5);
  color: #fff;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 900;
  flex-shrink: 0;
}
.lp-close { position: absolute; top: 8px; right: 10px; font-size: 11px; color: #64748b; padding: 4px; }
.animate-fade-in { animation: fadeIn 0.45s ease both; }
.animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.19, 1, 0.22, 1) both; }
.animate-stagger-in { animation: staggerIn 0.5s cubic-bezier(0.19, 1, 0.22, 1) both; }
.animate-dropdown { animation: dropDown 0.3s cubic-bezier(0.19, 1, 0.22, 1) both; }
.animate-pop-in { animation: popIn 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes staggerIn { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes dropDown { from { opacity: 0; transform: translateY(-8px) scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes popIn { 0% { transform: scale(0.9) translateY(12px); opacity: 0; } 100% { transform: none; opacity: 1; } }
.sk-block { border-radius: 18px; margin-bottom: 10px; }
.shimmer { background: var(--primary-soft, #eef2ff) !important; position: relative; overflow: hidden; }
.shimmer::after {
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  animation: shimmerAnim 2s infinite;
  content: '';
}
@keyframes shimmerAnim { 100% { transform: translateX(100%); } }
</style>
