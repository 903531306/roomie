<template>
  <view :class="themeClass" class="center-root">
    <IosNav title="清单中心" @leftClick="goBack" />

    <view class="page-body">
      <view class="toolbar-card">
        <view class="metrics-strip">
          <view class="metric-cell">
            <text class="m-val primary">{{ stats.pending }}</text>
            <text class="m-lbl">待办</text>
          </view>
          <view class="m-divider"></view>
          <view class="metric-cell">
            <text class="m-val urgent">{{ stats.overdue }}</text>
            <text class="m-lbl">逾期</text>
          </view>
          <view class="m-divider"></view>
          <view class="metric-cell">
            <text class="m-val">{{ stats.mine }}</text>
            <text class="m-lbl">我的</text>
          </view>
          <view class="m-divider"></view>
          <view class="metric-cell">
            <text class="m-val muted">{{ stats.completed }}</text>
            <text class="m-lbl">已完成</text>
          </view>
        </view>
      </view>

      <ChecklistQuickAdd
        v-model="quickTitle"
        :loading="isQuickAdding"
        :quick-today="quickToday"
        :quick-urgent="quickUrgent"
        :quick-assignee="quickAssignee"
        :assignee-label="assigneeChipLabel"
        placeholder="记一条待办…"
        @update:quickToday="quickToday = $event"
        @update:quickUrgent="quickUrgent = $event"
        @submit="handleQuickAdd"
        @more="openCreateDrawerWithDraft"
        @pickAssignee="showQuickAssigneePicker = true"
      />

      <view class="search-row">
        <view class="search-box field-shell">
          <text class="search-icon">🔍</text>
          <input v-model="searchKey" class="search-input" placeholder="搜索任务、成员、备注" />
          <view v-if="searchKey" class="clear-search" @tap="searchKey = ''">✕</view>
        </view>
        <view class="filter-btn" @tap="showFilterPanel = true">筛选</view>
      </view>

      <view class="tab-row">
              <view 
          v-for="tab in tabs"
          :key="tab.code"
          class="tab-chip"
          :class="{ active: currentTab === tab.code }"
          @tap="currentTab = tab.code"
        >
          <text>{{ tab.name }}</text>
              </view>
            </view>

      <scroll-view scroll-y class="board-scroll" :show-scrollbar="false" enable-back-to-top>
        <view class="board-scroll-inner">
          <block v-if="displayGroups.length">
            <view v-for="group in displayGroups" :key="group.key" class="task-group" :class="{ 'group-completed': group.key === 'completed' }">
              <text class="group-title" :class="{ red: group.key === 'overdue', green: group.key === 'completed' }">{{ group.label }}</text>
              <view class="task-panel" :class="{ 'panel-completed': group.key === 'completed' }">
                <ChecklistTaskLine
                  v-for="(task, idx) in group.tasks"
                :key="task.id" 
                  :task="task"
                  :room-id="roomId"
                  :account-id="accountId"
                  :completing-id="completingId"
                  :complete-phase="completePhase"
                  :completed="!!task.isCompleted || group.key === 'completed'"
                  :is-last="idx === group.tasks.length - 1"
                  :more-icon="task.isCompleted ? '⋯' : '›'"
                  @tap="onTaskTap(task)"
                  @complete="onCompleteTask"
                  @more="openActionSheet"
                  @ledger="openTaskDrawerForLedger"
                />
              </view>
            </view>
          </block>

          <view v-else class="empty-inline">
            <text class="empty-t">{{ emptyState.text }}</text>
            <view v-if="emptyState.showCreate" class="empty-btn" @tap="openCreateDrawer">新建任务</view>
          </view>
          
          <view class="bottom-safe-spacer"></view>
        </view>
      </scroll-view>
    </view>

    <view class="fab-add" @tap="openCreateDrawer"><text class="fab-icon">+</text></view>

    <ChecklistTaskDrawer
      v-model="showDrawer"
      :initial-task="drawerInitialTask"
      :room-members="roomMembers"
      :room-id="roomId"
      :account-id="accountId"
      @save="handleDrawerSave"
      @delete="handleDrawerDelete"
      @add-ledger="handleDrawerAddLedger"
    />

    <BottomPicker
      v-model="showQuickAssigneePicker"
      title="选择经办人"
      layout="list"
      :options="roomMembers"
      :currentSelected="quickAssignee"
      @change="quickAssignee = $event"
    />

    <BottomPicker
      v-model="showTransferPicker"
      title="转交给成员"
      layout="list"
      :options="roomMembers"
      :currentSelected="transferAssignee"
      @change="onTransferPick"
    />

    <view v-if="showFilterPanel" class="mask" @tap="showFilterPanel = false" @touchmove.stop.prevent>
      <view class="filter-sheet" @tap.stop>
        <view class="sheet-handle"></view>
        <text class="sheet-title">筛选任务</text>
        <view class="filter-block">
          <text class="filter-label">成员</text>
          <view class="filter-chips">
            <view v-for="item in memberFilters" :key="item.code" class="f-chip" :class="{ on: filters.member === item.code }" @tap="filters.member = item.code"><text>{{ item.name }}</text></view>
          </view>
                </view>
        <view class="filter-block">
          <text class="filter-label">优先级</text>
          <view class="filter-chips">
            <view v-for="item in priorityFilters" :key="item.code" class="f-chip" :class="{ on: filters.priority === item.code }" @tap="filters.priority = item.code"><text>{{ item.name }}</text></view>
          </view>
        </view>
        <view class="filter-block">
          <text class="filter-label">时间</text>
          <view class="filter-chips">
            <view v-for="item in timeFilters" :key="item.code" class="f-chip" :class="{ on: filters.time === item.code }" @tap="filters.time = item.code"><text>{{ item.name }}</text></view>
          </view>
        </view>
        <view class="filter-actions">
          <view class="filter-reset" @tap="resetFilters">重置</view>
          <view class="filter-apply" @tap="showFilterPanel = false">完成</view>
        </view>
      </view>
    </view>

    <view v-if="showActionSheet" class="mask" @tap="closeActionSheet" @touchmove.stop.prevent>
      <view class="action-sheet" @tap.stop>
        <view class="sheet-handle"></view>
        <text class="sheet-task-title">{{ actionTask?.title }}</text>
        <block v-if="!actionTask?.isCompleted">
          <view class="action-item" @tap="handleActionEdit">编辑</view>
          <view class="action-item" @tap="handleActionTransfer">转交给成员</view>
          <view class="action-item" @tap="handleActionToggleUrgent">{{ actionTask?.isUrgent == 1 ? '取消紧急' : '标记紧急' }}</view>
          <view class="action-item danger" @tap="handleActionDelete">删除</view>
        </block>
        <block v-else>
          <view class="action-item" @tap="handleActionRestore">恢复为待办</view>
          <view class="action-item" @tap="goToAddEntry">关联记账</view>
          <view class="action-item danger" @tap="handleActionDelete">删除</view>
        </block>
        <view class="action-cancel" @tap="closeActionSheet">取消</view>
      </view>
    </view>

    <view v-if="ledgerPrompt" class="ledger-prompt-wrap" @tap="ledgerPrompt = false">
      <view class="ledger-prompt-card" @tap.stop>
        <view class="lp-icon">💰</view>
        <view class="lp-content">
          <text class="lp-h">这项可能产生支出</text>
          <text class="lp-p">「{{ ledgerPromptTitle }}」要记一笔吗？</text>
        </view>
        <view class="lp-btn" @tap="goToAddEntry">记一笔</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass } = useAppTheme()

import { ref, reactive, computed, onMounted, watch } from 'vue'
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app'
import IosNav from '../../components/nav/ios-nav.vue'
import BottomPicker from '../../components/common/BottomPicker.vue'
import ChecklistQuickAdd from '../../components/checklist/ChecklistQuickAdd.vue'
import ChecklistTaskLine from '../../components/checklist/ChecklistTaskLine.vue'
import ChecklistTaskDrawer from '../../components/checklist/ChecklistTaskDrawer.vue'
import { buildDisplayTask, normalizeRoomMember } from '../../common/utils/checklistTaskDisplay.js'
import { roomApi, taskApi } from '../../common/api'
import dataJson from '/data.json'
import { getDateStr, normalizeTaskDueDate, toTaskDueDateTimestamp } from '../js/utils.js'
import { coalesce, pickApiList } from '@/common/utils/coalesce.js'

const CONSUME_KEYWORDS = ['买', '购', '付', '费', '支', '花', '交', '定', '餐', '订', '缴', '采购']
const COMPLETE_SWEEP_MS = 560
const COMPLETE_DONE_MS = 480

const roomId = ref(null)
const accountId = ref(null)
const currentUserId = ref(null)

const pendingTasks = ref([])
const overdueTasks = ref([])
const completedTasks = ref([])
const roomMembers = ref([])

const currentTab = ref('active')
const searchKey = ref('')
const quickTitle = ref('')
const quickToday = ref(true)
const quickUrgent = ref(false)
const quickAssignee = ref(null)
const isQuickAdding = ref(false)
const showFilterPanel = ref(false)
const showActionSheet = ref(false)
const showDrawer = ref(false)
const showQuickAssigneePicker = ref(false)
const showTransferPicker = ref(false)
const drawerInitialTask = ref(null)

const actionTask = ref(null)
const transferAssignee = ref(null)
const completingId = ref(null)
const completePhase = ref('')
const ledgerPrompt = ref(false)
const ledgerPromptTitle = ref('')
const ledgerPromptTaskId = ref(null)
const checklistDirty = ref(false)
const CHECKLIST_REFRESH_KEY = 'checklist_board_dirty_room'

const filters = reactive({
  member: 'all',
  priority: 'all',
  time: 'all'
})

const tabs = [
  { name: '进行中', code: 'active' },
  { name: '已完成', code: 'completed' },
  { name: '全部', code: 'all' }
]

const memberFilters = [
  { name: '全部成员', code: 'all' },
  { name: '只看我的', code: 'mine' },
  { name: '未分配', code: 'unassigned' }
]
const priorityFilters = [
  { name: '全部优先级', code: 'all' },
  { name: '紧急', code: 'urgent' },
  { name: '普通', code: 'normal' }
]
const timeFilters = [
  { name: '全部时间', code: 'all' },
  { name: '今天', code: 'today' },
  { name: '本周', code: 'week' },
  { name: '逾期', code: 'overdue' }
]

onLoad((e) => {
  roomId.value = e.roomId
  accountId.value = e.accountId
})

onShow(async () => {
  const dirtyRoomId = uni.getStorageSync(CHECKLIST_REFRESH_KEY)
  if (!dirtyRoomId || String(dirtyRoomId) !== String(coalesce(roomId.value, ''))) return
  uni.removeStorageSync(CHECKLIST_REFRESH_KEY)
  await loadAllTasks()
})

onMounted(async () => {
  syncUserInfo()
  await Promise.all([loadAllTasks(), loadMembers()])
})

function syncUserInfo() {
  if (!dataJson.userInfo) {
    const saved = uni.getStorageSync('userInfo')
    if (saved) dataJson.userInfo = saved
  }
  currentUserId.value = coalesce(dataJson.userInfo && dataJson.userInfo.userId, null)
}

const overdueIdSet = computed(() => new Set(overdueTasks.value.map((t) => String(t.id))))

const mergedActive = computed(() => {
  const map = new Map()
  overdueTasks.value.forEach((t) => map.set(String(t.id), t))
  pendingTasks.value.forEach((t) => {
    if (!map.has(String(t.id))) map.set(String(t.id), t)
  })
  return Array.from(map.values()).map((t) =>
    buildDisplayTask(t, { roomMembers: roomMembers.value, overdueIds: overdueIdSet.value, isCompleted: false })
  )
})

const normalizedCompleted = computed(() =>
  completedTasks.value.map((t) =>
    buildDisplayTask(t, { roomMembers: roomMembers.value, overdueIds: overdueIdSet.value, isCompleted: true })
  )
)

const stats = computed(() => ({
  pending: mergedActive.value.length,
  overdue: mergedActive.value.filter((t) => t.groupKey === 'overdue').length,
  mine: mergedActive.value.filter((t) => String(coalesce(t.assigneeId, t.assignee && t.assignee.id, '')) === String(coalesce(currentUserId.value, ''))).length,
  completed: completedTasks.value.length
}))

const assigneeChipLabel = computed(() => {
  if (!quickAssignee.value) return '经办人'
  const label = quickAssignee.value.label || quickAssignee.value.nickname || '已选'
  return label.length > 4 ? `${label.slice(0, 4)}…` : label
})

function matchSearch(task) {
  if (!searchKey.value.trim()) return true
  const key = searchKey.value.trim().toLowerCase()
  return [task.title, task.sublineText, task.assigneeDisplayName, task.description, task.note]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(key))
}

function matchFilters(task) {
  const assigneeId = coalesce(task.assigneeId, task.assignee && task.assignee.id)
  if (filters.member === 'mine' && String(coalesce(assigneeId, '')) !== String(coalesce(currentUserId.value, ''))) return false
  if (filters.member === 'unassigned' && assigneeId != null && assigneeId !== '') return false
  if (filters.priority === 'urgent' && task.isUrgent != 1) return false
  if (filters.priority === 'normal' && task.isUrgent == 1) return false
  if (filters.time === 'today' && task.groupKey !== 'today') return false
  if (filters.time === 'week' && !['today', 'week'].includes(task.groupKey)) return false
  if (filters.time === 'overdue' && task.groupKey !== 'overdue') return false
  return true
}

const filteredActive = computed(() =>
  mergedActive.value.filter((t) => matchSearch(t) && matchFilters(t))
)
const filteredCompleted = computed(() =>
  normalizedCompleted.value.filter((t) => matchSearch(t) && matchFilters(t))
)

const displayGroups = computed(() => {
  if (currentTab.value === 'completed') {
    return filteredCompleted.value.length
      ? [{ key: 'completed', label: '已完成', tasks: filteredCompleted.value }]
      : []
  }
  if (currentTab.value === 'all') {
    const groups = buildActiveGroups(filteredActive.value)
    if (filteredCompleted.value.length) {
      groups.push({ key: 'completed', label: '已完成', tasks: filteredCompleted.value })
    }
    return groups
  }
  return buildActiveGroups(filteredActive.value)
})

function buildActiveGroups(tasks) {
  const defs = [
    { key: 'overdue', label: '逾期' },
    { key: 'today', label: '今天' },
    { key: 'week', label: '未来 7 天' },
    { key: 'none', label: '无截止时间' }
  ]
  return defs
    .map((d) => ({ ...d, tasks: tasks.filter((t) => t.groupKey === d.key) }))
    .filter((g) => g.tasks.length)
}

const emptyState = computed(() => {
  if (searchKey.value.trim()) {
    return { text: '没有找到相关任务', showCreate: false }
  }
  if (currentTab.value === 'completed') {
    return { text: '完成任务后会归档在这里', showCreate: true }
  }
  if (currentTab.value === 'active') {
    return { text: '今天很清爽，没有待处理事项', showCreate: true }
  }
  return { text: '还没有任务，先添加一条吧', showCreate: true }
})

async function loadAllTasks() {
  const res = await taskApi.taskAllList({ roomId: roomId.value })
  if (res.code == 0) {
    completedTasks.value = pickApiList(res.data, 'completed')
    pendingTasks.value = pickApiList(res.data, 'pending')
    overdueTasks.value = pickApiList(res.data, 'overdue')
  }
}

async function loadMembers() {
  const res = await roomApi.getRoomMembers({ roomId: roomId.value })
  if (res.code == 0) {
    roomMembers.value = (res.data || []).map(normalizeRoomMember)
  }
}

function resetFilters() {
  filters.member = 'all'
  filters.priority = 'all'
  filters.time = 'all'
}

function resetQuickOptions() {
  quickToday.value = true
  quickUrgent.value = false
  quickAssignee.value = null
}

function markChecklistDirty() {
  checklistDirty.value = true
}

function persistChecklistDirty() {
  if (!checklistDirty.value || roomId.value == null || roomId.value === '') return
  uni.setStorageSync(CHECKLIST_REFRESH_KEY, String(roomId.value))
  uni.$emit('checklist_board_refresh')
}

function goBack() {
  persistChecklistDirty()
  uni.navigateBack()
}

onUnload(() => {
  persistChecklistDirty()
})

function isTaskCompleted(task) {
  if (!task) return false
  return !!(
    task.isCompleted ||
    task.groupKey === 'completed' ||
    task.bucket === 'completed' ||
    task.status === 'completed' ||
    task.status === 1
  )
}

function openTaskDrawer(task) {
  if (isTaskCompleted(task)) {
    openActionSheet(task)
    return
  }
  drawerInitialTask.value = task
  showDrawer.value = true
}

function openTaskDrawerForLedger(task) {
  drawerInitialTask.value = task
  showDrawer.value = true
}

watch(showDrawer, (visible) => {
  if (!visible) return
  const task = drawerInitialTask.value
  if (!isTaskCompleted(task)) return
  const recordCount = coalesce(task && task.recordCount, 0)
  if (recordCount > 1) return
  showDrawer.value = false
  openActionSheet(task)
})

function openCreateDrawer() {
  drawerInitialTask.value = null
  showDrawer.value = true
}

function openCreateDrawerWithDraft() {
  drawerInitialTask.value = quickTitle.value.trim()
    ? {
        title: quickTitle.value.trim(),
        isUrgent: quickUrgent.value,
        assignee: quickAssignee.value,
        dueDate: quickToday.value ? getDateStr(Date.now()) : ''
      }
    : null
  showDrawer.value = true
}

function onTaskTap(task) {
  if (completingId.value === task.id) return
  openTaskDrawer(task)
}

function openActionSheet(task) {
  actionTask.value = task
  showActionSheet.value = true
}

function closeActionSheet() {
  showActionSheet.value = false
  actionTask.value = null
}

function handleActionEdit() {
  const task = actionTask.value
  closeActionSheet()
  if (!task || isTaskCompleted(task)) return
  openTaskDrawer(task)
}

async function handleActionTransfer() {
  const task = actionTask.value
  closeActionSheet()
  if (!task) return
  transferAssignee.value = task.assignee || null
  actionTask.value = task
  showTransferPicker.value = true
}

async function onTransferPick(item) {
  if (!actionTask.value?.id || !item?.id) return
  const res = await taskApi.assignTask(String(actionTask.value.id), String(item.id))
  if (res.code == 0) {
    uni.showToast({ title: '已转交', icon: 'success' })
    markChecklistDirty()
    await loadAllTasks()
  } else {
    uni.showToast({ title: '转交失败', icon: 'none' })
  }
  showTransferPicker.value = false
}

async function handleActionToggleUrgent() {
  const task = actionTask.value
  closeActionSheet()
  if (!task?.id) return
  const res = await taskApi.updateTask({
    id: task.id,
    roomId: roomId.value,
    title: task.title,
    isUrgent: task.isUrgent == 1 ? 0 : 1,
    assigneeId: task.assigneeId,
    description: task.description || task.note,
    dueDate: task.dueDate ? toTaskDueDateTimestamp(normalizeTaskDueDate(task.dueDate)) : undefined
  })
  if (res.code == 0) {
    uni.showToast({ title: '已更新', icon: 'success' })
    markChecklistDirty()
    await loadAllTasks()
  }
}

async function handleActionDelete() {
  const task = actionTask.value
  closeActionSheet()
  if (!task?.id) return
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复',
    success: async (res) => {
      if (!res.confirm) return
      const resp = await taskApi.deleteTask(task.id, roomId.value)
      if (resp.code == 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        markChecklistDirty()
        await loadAllTasks()
      }
    }
  })
}

function handleActionRestore() {
  const task = actionTask.value
  closeActionSheet()
  if (!task?.id) return
  uni.showLoading({ title: '恢复中...' })
  taskApi.resetTask(task.id)
    .then(async (res) => {
      if (res.code == 0) {
        uni.showToast({ title: '已恢复为待办', icon: 'success' })
        markChecklistDirty()
        await loadAllTasks()
      } else {
        uni.showToast({ title: res.message || '恢复失败', icon: 'none' })
      }
    })
    .catch(() => {
      uni.showToast({ title: '恢复失败', icon: 'none' })
    })
    .finally(() => {
      uni.hideLoading()
    })
}

async function handleDrawerSave(form) {
  const dueDateStr = normalizeTaskDueDate(form.dueDate)
  const payload = {
    roomId: roomId.value,
    title: form.title.trim(),
    isUrgent: form.isUrgent ? 1 : 0,
    assigneeId: form.assignee?.id,
    description: form.note,
    dueDate: dueDateStr ? toTaskDueDateTimestamp(dueDateStr) : undefined,
    actorName: form.assignee?.label || ''
  }
  const res = form.id
    ? await taskApi.updateTask({ ...payload, id: form.id })
    : await taskApi.createTask(payload)
  if (res.code == 0) {
    uni.showToast({ title: '已保存', icon: 'success' })
    markChecklistDirty()
    quickTitle.value = ''
    resetQuickOptions()
    await loadAllTasks()
  }
}

async function handleDrawerDelete(taskId) {
  const resp = await taskApi.deleteTask(taskId, roomId.value)
  if (resp.code == 0) {
    uni.showToast({ title: '已删除', icon: 'success' })
    markChecklistDirty()
    await loadAllTasks()
  }
}

async function handleQuickAdd() {
  const title = quickTitle.value.trim()
  if (!title || isQuickAdding.value) return
  isQuickAdding.value = true
  try {
    const dueDateStr = quickToday.value ? getDateStr(Date.now()) : ''
    const res = await taskApi.createTask({
      roomId: roomId.value,
      title,
      isUrgent: quickUrgent.value ? 1 : 0,
      assigneeId: quickAssignee.value?.id,
      actorName: quickAssignee.value?.label || '',
      dueDate: dueDateStr ? toTaskDueDateTimestamp(dueDateStr) : undefined
    })
    if (res.code == 0) {
      quickTitle.value = ''
      resetQuickOptions()
      markChecklistDirty()
      await loadAllTasks()
    }
  } finally {
    isQuickAdding.value = false
  }
}

function looksLikeConsume(title) {
  return CONSUME_KEYWORDS.some((k) => title.includes(k))
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function onCompleteTask(task) {
  if (completingId.value === task.id || task.isCompleted) return
  completingId.value = task.id
  completePhase.value = 'sweep'
  const apiPromise = taskApi.complateTask(task.id).catch(() => ({ code: -1 }))
  await waitMs(COMPLETE_SWEEP_MS)
  if (completingId.value !== task.id) return
  completePhase.value = 'done'
  await waitMs(COMPLETE_DONE_MS)
  if (completingId.value !== task.id) return
  try {
    const res = await apiPromise
    if (res.code == 0) {
      if (looksLikeConsume(task.title)) {
        ledgerPromptTitle.value = task.title
        ledgerPromptTaskId.value = task.id
        ledgerPrompt.value = true
      }
      markChecklistDirty()
      await loadAllTasks()
    } else {
      uni.showToast({ title: '完成失败', icon: 'none' })
    }
  } finally {
    completingId.value = null
    completePhase.value = ''
  }
}

function goToAddEntryFromTask(task) {
  const target = task || actionTask.value || drawerInitialTask.value
  if (!target?.id) return
  let url = `/pages/add-entry/add-entry?roomId=${roomId.value}&accountId=${accountId.value}&taskId=${target.id}`
  const title = target.title || target.note
  if (title) url += `&note=${encodeURIComponent(title)}`
  uni.navigateTo({ url })
}

function goToAddEntry() {
  const task = actionTask.value || (ledgerPromptTaskId.value ? {
    id: ledgerPromptTaskId.value,
    title: ledgerPromptTitle.value
  } : null)
  ledgerPrompt.value = false
  ledgerPromptTaskId.value = null
  closeActionSheet()
  goToAddEntryFromTask(task)
}

function handleDrawerAddLedger(task) {
  showDrawer.value = false
  goToAddEntryFromTask(task)
}
</script>

<style scoped>
.center-root {
  height: 100vh;
  background: #f8fafc;
			display: flex;
			flex-direction: column;
  overflow: hidden;
}

.page-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px 14px 0;
}

.toolbar-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 18px;
  padding: 10px 12px;
  margin-bottom: 10px;
  border: 1px solid #f1f5f9;
}
.metrics-strip {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.metric-cell {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}
.m-val {
  font-size: 18px;
  font-weight: 900;
  color: #334155;
  line-height: 1;
}
.m-val.primary { color: var(--primary-color, #4f46e5); }
.m-val.urgent { color: #dc2626; }
.m-val.muted { color: #94a3b8; }
.m-lbl {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}
.m-divider {
  width: 1px;
  height: 16px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.field-shell {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-sizing: border-box;
}
.search-box { 
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 6px;
}
.search-icon { font-size: 13px; opacity: 0.35; }
.search-input { flex: 1; font-size: 13px; color: #334155; font-weight: 600; }
.clear-search { font-size: 12px; color: #cbd5e1; padding: 4px; }
.filter-btn {
  height: 40px;
  padding: 0 14px;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  background: #fff;
  font-size: 12px;
  font-weight: 800;
  color: var(--primary-color, #4f46e5);
  display: flex;
  align-items: center;
}

.tab-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.tab-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #f1f5f9;
  box-sizing: border-box;
}
.tab-chip text {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  line-height: 1;
  display: block;
}
.tab-chip.active {
  background: var(--primary-soft, #eef2ff);
  border-color: var(--primary-color, #4f46e5);
}
.tab-chip.active text {
  color: var(--primary-color, #4f46e5);
}

.board-scroll { flex: 1; height: 0; }
.board-scroll-inner { padding-bottom: 80px; }

.group-title {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  margin: 4px 0 6px 4px;
  letter-spacing: 0.5px;
}
.group-title.red { color: #dc2626; }
.group-title.green { color: #94a3b8; font-weight: 700; }
.task-group { margin-bottom: 10px; }
.group-completed { margin-top: 2px; }

.task-panel {
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #f1f5f9;
}
.panel-completed {
  border-color: #f1f5f9;
  background: #ffffff;
  box-shadow: none;
}

.empty-inline {
  padding: 36px 16px;
  text-align: center;
  background: #fff;
  border-radius: 18px;
  border: 1px dashed #e2e8f0;
}
.empty-t {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 12px;
}
.empty-btn {
  display: inline-flex;
  padding: 10px 18px;
  border-radius: 999px;
  background: var(--primary-soft, #eef2ff);
  color: var(--primary-color, #4f46e5);
  font-size: 12px;
  font-weight: 800;
}

.bottom-safe-spacer { height: 24px; }

.fab-add {
  position: fixed;
  right: 20px;
  bottom: 28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-color, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 28px var(--primary-glow, rgba(79, 70, 229, 0.28));
  z-index: 100;
}
.fab-icon {
  color: #fff;
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}
.filter-sheet,
.action-sheet {
  width: 100%;
  background: #fff;
  border-radius: 28px 28px 0 0;
  padding: 8px 20px 24px;
}
.sheet-handle {
  width: 42px;
  height: 5px;
  border-radius: 10px;
  background: #e2e8f0;
  margin: 0 auto 16px;
}
.sheet-title {
  display: block;
  font-size: 18px;
  font-weight: 900;
  color: #1e293b;
  margin-bottom: 16px;
}
.sheet-task-title {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: #334155;
  margin-bottom: 12px;
  text-align: center;
}
.filter-block { margin-bottom: 16px; }
.filter-label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.filter-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.f-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
}
.f-chip text {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  line-height: 1;
  display: block;
}
.f-chip.on {
  background: var(--primary-soft, #eef2ff);
  border-color: var(--primary-color, #4f46e5);
}
.f-chip.on text { color: var(--primary-color, #4f46e5); }
.filter-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.filter-reset,
.filter-apply {
  flex: 1;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
}
.filter-reset { background: #f1f5f9; color: #64748b; }
.filter-apply {
  background: var(--primary-color, #4f46e5);
  color: #fff;
}

.action-item {
  padding: 16px 0;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}
.action-item.danger { color: #f43f5e; }
.action-cancel {
  margin-top: 8px;
  padding: 14px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
}

.ledger-prompt-wrap {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  z-index: 1100;
  display: flex;
  align-items: flex-end;
  padding: 16px;
}
.ledger-prompt-card {
  width: 100%;
  background: #fff;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.lp-icon { font-size: 28px; }
.lp-content { flex: 1; min-width: 0; }
.lp-h { display: block; font-size: 14px; font-weight: 900; color: #1e293b; }
.lp-p { display: block; font-size: 12px; color: #64748b; margin-top: 2px; }
.lp-btn {
  padding: 8px 14px;
  border-radius: 12px;
  background: var(--primary-color, #4f46e5);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}
</style>
