<template>
  <view
    v-if="modelValue"
    class="global-fixed-mask"
    :class="[themeClass, { 'mask-closing': isClosing }]"
    @click="close"
    @touchmove.stop.prevent
  >
    <view
      class="global-fixed-drawer"
      :class="themeClass"
      :style="{ transform: `translateY(${panelY}px)` }"
      @click.stop
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view class="modal-handle" :style="{ background: primaryColor }"></view>
      <view class="modal-header">
        <view class="header-main">
          <text class="modal-title">{{ form.id ? '编辑任务项' : '新建协作任务' }}</text>
        </view>
        <view v-if="form.id" class="modal-delete-btn" @click="handleDelete">删除</view>
      </view>
      <scroll-view scroll-y class="modal-scroll-body">
        <view class="modal-inner-padding">
          <view class="modal-input-group">
            <text class="modal-label">任务内容</text>
            <view class="field-shell title-input-card" :class="{ 'field-shell-focus': titleFocus }">
              <textarea
                v-model="form.title"
                class="title-textarea-flat"
                placeholder="输入要做的内容..."
                auto-height
                @focus="titleFocus = true"
                @blur="titleFocus = false"
              />
            </view>
          </view>
          <view class="modal-config-grid">
            <view class="m-config-card assignee-card" @click="showAssigneePicker = true">
              <text class="mc-label">经办人</text>
              <view class="mc-val-box">
                <image v-if="assigneeAvatar" :src="assigneeAvatar" class="mc-avt-mini" mode="aspectFill" />
                <view v-else class="mc-avt-placeholder">👤</view>
                <text class="mc-val mc-val-ellipsis">{{ form.assignee ? form.assignee.label : '所有人' }}</text>
                <text class="mc-arrow">›</text>
              </view>
            </view>
            <view class="m-config-card">
              <text class="mc-label">设为紧急</text>
              <view class="mc-val-box urgent-row">
                <text class="mc-val" :style="{ color: form.isUrgent ? '#F43F5E' : '#94A3B8' }">{{ form.isUrgent ? '紧急' : '普通' }}</text>
                <switch :checked="form.isUrgent" @change="form.isUrgent = $event.detail.value" color="#F43F5E" scale="0.6" />
              </view>
            </view>
          </view>
          <view class="modal-input-group">
            <text class="modal-label">截止日期</text>
            <picker mode="date" :start="todayStr" :value="pickerDate" @change="onDueDateChange">
              <view class="picker-card-option">
                <view class="pc-left">
                  <text class="pc-emoji">📅</text>
                  <text class="pc-label">完成日期</text>
                </view>
                <view class="pc-right">
                  <text class="pc-val">{{ dueDateLabel }}</text>
                  <text v-if="form.dueDate" class="pc-clear" @tap.stop="form.dueDate = ''">清除</text>
                </view>
              </view>
            </picker>
          </view>
          <view class="modal-input-group">
            <text class="modal-label">补充备注</text>
            <view class="field-shell remark-box" :class="{ 'field-shell-focus': noteFocus }">
              <textarea
                v-model="form.note"
                class="remark-textarea"
                placeholder="填写细节备注..."
                @focus="noteFocus = true"
                @blur="noteFocus = false"
              />
            </view>
          </view>

          <view v-if="form.id" class="modal-input-group ledger-group">
            <view class="ledger-group-head">
              <text class="modal-label ledger-label">关联记账</text>
              <view v-if="ledgerSummary.recordCount > 0" class="ledger-summary-row">
                <text class="ledger-summary-amount">合计支出 ¥{{ ledgerSummary.ledgerAmountDisplay }}</text>
                <text class="ledger-summary-count">{{ ledgerSummary.recordCount }} 笔</text>
              </view>
            </view>

            <view v-if="ledgerSummary.hasLedgerRecordsDetail" class="ledger-record-list">
              <view
                v-for="record in ledgerSummary.ledgerRecords"
                :key="record.id || record.title + record.dateDisplay"
                class="ledger-record-item"
                @click="openLedgerRecord(record)"
              >
                <view class="ledger-record-main">
                  <text class="lr-title">{{ record.title }}</text>
                  <text class="lr-amount">¥{{ record.amountDisplay }}</text>
                </view>
                <text v-if="record.dateDisplay" class="lr-date">{{ record.dateDisplay }}</text>
              </view>
            </view>
            <view v-else-if="ledgerSummary.recordCount > 0" class="ledger-records-hint">
              <text>已关联 {{ ledgerSummary.recordCount }} 笔记账</text>
              <text class="ledger-records-hint-sub">明细暂未加载，可在收支流水中查看</text>
            </view>
            <view v-else class="ledger-empty">暂无关联记账</view>

            <view class="ledger-actions">
              <view class="ledger-action-btn" @click="handleAddLedger">+ 新增记账</view>
              <view class="ledger-action-btn ghost" @click="handleViewLedgers">查看流水</view>
            </view>
          </view>
        </view>
      </scroll-view>
      <view class="modal-footer">
        <button class="modal-primary-btn" @click="handleSave">确认保存</button>
      </view>
    </view>
  </view>

  <BottomPicker
    v-model="showAssigneePicker"
    title="选择经办人"
    layout="list"
    :options="roomMembers"
    :currentSelected="form.assignee"
    @change="onAssigneeChange"
  />
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import BottomPicker from '../common/BottomPicker.vue'
import { useAppTheme } from '@/common/themes/useAppTheme.js'
import { getDateStr, normalizeTaskDueDate } from '../../pages/js/utils.js'
import { resolveTaskLedgerSummary } from '../../common/utils/checklistTaskDisplay.js'
import { coalesce } from '@/common/utils/coalesce.js'

function getMemberAvatar(member) {
  if (!member) return ''
  return member.avatar || member.userHeadUrl || member.headUrl || member.userAvatar || ''
}

function findRoomMember(roomMembers, assigneeId) {
  if (assigneeId == null || assigneeId === '') return null
  return (roomMembers || []).find(
    (member) =>
      String(member.id) === String(assigneeId) ||
      String(member.userId) === String(assigneeId)
  ) || null
}

const { themeClass, primaryColor } = useAppTheme()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialTask: { type: Object, default: null },
  roomMembers: { type: Array, default: () => [] },
  roomId: { type: [String, Number], default: '' },
  accountId: { type: [String, Number], default: '' }
})

const emit = defineEmits(['update:modelValue', 'save', 'delete', 'add-ledger'])

const EMPTY_FORM = () => ({
  id: null,
  title: '',
  isUrgent: false,
  assignee: null,
  assigneeId: null,
  note: '',
  dueDate: ''
})

const form = reactive(EMPTY_FORM())
const formSnapshot = ref(null)
const titleFocus = ref(false)
const noteFocus = ref(false)
const showAssigneePicker = ref(false)
const isClosing = ref(false)
const panelY = ref(0)
let startY = 0

const todayStr = computed(() => getDateStr(new Date()))
const assigneeAvatar = computed(() => getMemberAvatar(form.assignee))
const dueDateLabel = computed(() => {
  const dueDate = normalizeTaskDueDate(form.dueDate)
  if (!dueDate) return '不限日期'
  if (dueDate === todayStr.value) return `今天 · ${dueDate}`
  return dueDate
})
const pickerDate = computed(() => {
  const dueDate = normalizeTaskDueDate(form.dueDate)
  if (!dueDate) return todayStr.value
  return dueDate < todayStr.value ? todayStr.value : dueDate
})

const ledgerSummary = computed(() => resolveTaskLedgerSummary(props.initialTask || form))

function resolveAssignee(task) {
  if (!task) return null
  const assignee = task.assignee || null
  const assigneeId = coalesce(task.assigneeId, assignee && assignee.id, null)
  const nickname = coalesce(
    task.assigneeNickname,
    task.actorName,
    assignee && assignee.label,
    assignee && assignee.nickname,
    null
  )
  const avatar = task.assigneeAvatar || getMemberAvatar(task.assignee) || null
  const member = findRoomMember(props.roomMembers, assigneeId)
  if (member) {
    return {
      ...member,
      id: coalesce(member.id, assigneeId),
      label: member.label || nickname || '',
      avatar: getMemberAvatar(member) || avatar || ''
    }
  }
  if ((assignee && assignee.label) || (assignee && assignee.nickname)) {
    return {
      ...assignee,
      id: coalesce(assignee.id, assigneeId),
      label: assignee.label || assignee.nickname || nickname || '',
      avatar: getMemberAvatar(assignee) || avatar || ''
    }
  }
  if (nickname || avatar || assigneeId != null) {
    return { id: assigneeId, label: nickname || '', avatar: avatar || '' }
  }
  return null
}

function normalizeForm(f) {
  const formRef = f || {}
  const formAssignee = formRef.assignee || null
  return {
    title: (formRef.title || '').trim(),
    isUrgent: !!formRef.isUrgent && formRef.isUrgent != 0,
    assigneeId: coalesce(formAssignee && formAssignee.id, formRef.assigneeId, null),
    note: (formRef.note || formRef.description || '').trim(),
    dueDate: normalizeTaskDueDate(coalesce(formRef.dueDate, formRef.deadline))
  }
}

function resetForm() {
  Object.keys(form).forEach((key) => { delete form[key] })
  Object.assign(form, EMPTY_FORM())
  formSnapshot.value = null
}

function fillForm(task) {
  resetForm()
  if (!task) {
    form.dueDate = getDateStr(new Date())
    return
  }
  Object.assign(form, JSON.parse(JSON.stringify(task)))
  form.note = coalesce(task.note, task.description, '')
  form.dueDate = normalizeTaskDueDate(coalesce(task.dueDate, task.deadline)) || (!task.id ? getDateStr(new Date()) : '')
  form.assigneeId = coalesce(task.assigneeId, task.assignee && task.assignee.id, null)
  form.assignee = resolveAssignee(task)
  formSnapshot.value = form.id ? normalizeForm(form) : null
}

function isFormChanged() {
  if (!form.id || !formSnapshot.value) return true
  const current = normalizeForm(form)
  const original = formSnapshot.value
  return (
    current.title !== original.title ||
    current.isUrgent !== original.isUrgent ||
    String(coalesce(current.assigneeId, '')) !== String(coalesce(original.assigneeId, '')) ||
    current.note !== original.note ||
    current.dueDate !== original.dueDate
  )
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      panelY.value = 0
      isClosing.value = false
      fillForm(props.initialTask)
    } else {
      resetForm()
      titleFocus.value = false
      noteFocus.value = false
    }
  }
)

watch(
  () => props.initialTask,
  (task) => {
    if (props.modelValue) fillForm(task)
  }
)

watch(
  () => props.roomMembers,
  () => {
    if (!props.modelValue) return
    const resolved = resolveAssignee(form)
    if (resolved) form.assignee = resolved
  }
)

function close() {
  emit('update:modelValue', false)
}

function closeAnimated() {
  isClosing.value = true
  panelY.value = 800
  setTimeout(() => {
    emit('update:modelValue', false)
    isClosing.value = false
    panelY.value = 0
  }, 300)
}

function onTouchStart(e) {
  startY = e.touches[0].clientY
}

function onTouchMove(e) {
  const diff = e.touches[0].clientY - startY
  if (diff > 0) panelY.value = diff
}

function onTouchEnd() {
  if (panelY.value > 150) closeAnimated()
  else panelY.value = 0
}

function onAssigneeChange(item) {
  form.assignee = item ? { ...item, avatar: getMemberAvatar(item) } : null
}

function onDueDateChange(e) {
  const picked = e.detail.value
  if (picked < todayStr.value) {
    uni.showToast({ title: '不能选择今天之前的日期', icon: 'none' })
    return
  }
  form.dueDate = picked
}

function handleSave() {
  if (!form.title.trim()) {
    uni.showToast({ title: '请输入任务内容', icon: 'none' })
    return
  }
  if (!isFormChanged()) {
    uni.showToast({ title: '没有修改任何内容', icon: 'none' })
    return
  }
  emit('save', { ...form })
  closeAnimated()
}

function handleDelete() {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这项任务吗？',
    success: (res) => {
      if (!res.confirm || !form.id) return
      emit('delete', form.id)
      closeAnimated()
    }
  })
}

function openLedgerRecord(record) {
  if (!props.roomId || !props.accountId || !record?.id) return
  uni.navigateTo({
    url: `/pages/add-entry/add-entry?roomId=${props.roomId}&accountId=${props.accountId}&id=${record.id}`
  })
}

function handleAddLedger() {
  if (!form.id) return
  emit('add-ledger', { ...form, ...ledgerSummary.value })
}

function handleViewLedgers() {
  if (!props.roomId) return
  let url = `/pages/ledger-all/ledger-all?roomId=${props.roomId}`
  if (props.accountId) url += `&accountId=${props.accountId}`
  if (form.id) url += `&linkTaskId=${form.id}`
  uni.navigateTo({ url })
}
</script>

<style scoped>
.global-fixed-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(25px);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  transition: opacity 0.3s;
}
.mask-closing { opacity: 0; }
.global-fixed-drawer {
  width: 100%;
  background: #fff;
  border-radius: 44px 44px 0 0;
  height: 72vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -20px 60px var(--primary-glow, rgba(79, 70, 229, 0.15));
  padding-top: 8px;
}
.modal-handle {
  width: 42px;
  height: 5px;
  border-radius: 10px;
  margin: 0 auto 20px;
  opacity: 0.85;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 24px 24px;
}
.modal-title {
  font-size: 22px;
  font-weight: 900;
  color: #1e293b;
  margin-top: 4px;
  display: block;
}
.modal-delete-btn {
  font-size: 15px;
  color: #f43f5e;
  font-weight: bold;
  padding: 10px;
}
.modal-scroll-body { flex: 1; height: 0; }
.modal-inner-padding { padding: 0 24px 24px; }
.modal-label {
  font-size: 11px;
  font-weight: 900;
  color: #cbd5e1;
  margin-bottom: 14px;
  display: block;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
.field-shell {
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  border: 1px solid var(--primary-soft, #eef2ff);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  box-sizing: border-box;
}
.field-shell-focus {
  border-color: var(--primary-color, #4f46e5);
  box-shadow: 0 8px 20px var(--primary-glow, rgba(79, 70, 229, 0.1));
}
.title-input-card { margin-bottom: 10px; }
.title-textarea-flat {
  width: 100%;
  font-size: 20px;
  font-weight: 900;
  color: #1e293b;
  line-height: 1.4;
}
.modal-input-group { margin-bottom: 20px; }
.modal-config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 20px 0;
}
.m-config-card {
  background: var(--primary-soft, #eef2ff);
  border-radius: 20px;
  padding: 14px;
  border: 1px solid var(--primary-glow, rgba(79, 70, 229, 0.08));
  min-height: 72px;
  box-sizing: border-box;
}
.m-config-card.assignee-card:active { opacity: 0.92; }
.mc-label {
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  display: block;
  margin-bottom: 8px;
}
.mc-val-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.mc-avt-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid #fff;
  background: #fff;
}
.mc-avt-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: 1px solid var(--primary-glow, rgba(79, 70, 229, 0.12));
}
.mc-val {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 800;
  color: #334155;
}
.mc-val-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mc-arrow {
  font-size: 16px;
  color: var(--primary-color, #4f46e5);
  flex-shrink: 0;
  opacity: 0.5;
}
.urgent-row { justify-content: space-between; align-items: center; width: 100%; }
.picker-card-option {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: var(--primary-soft, #eef2ff);
  border-radius: 20px;
  border: 1px solid var(--primary-glow, rgba(79, 70, 229, 0.08));
  box-sizing: border-box;
}
.pc-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.pc-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.pc-emoji { font-size: 18px; }
.pc-label { font-size: 15px; font-weight: 800; color: #475569; }
.pc-val { font-size: 15px; font-weight: 900; color: var(--primary-color, #4f46e5); }
.pc-clear { font-size: 12px; font-weight: 800; color: #94a3b8; padding: 6px 0 6px 8px; }
.remark-box { padding: 12px 16px; }
.remark-textarea {
  width: 100%;
  height: 120px;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
  line-height: 1.5;
}
.modal-footer { padding: 12px 24px; }
.modal-primary-btn {
  justify-content: center;
  align-items: center;
  display: flex;
  width: 100%;
  background: var(--primary-color, #4f46e5);
  color: #fff;
  height: 72px;
  border-radius: 24px;
  font-size: 17px;
  font-weight: 900;
  box-shadow: 0 10px 30px var(--primary-glow, rgba(79, 70, 229, 0.25));
  border: none;
}

.ledger-group { margin-bottom: 8px; }
.ledger-group-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.ledger-label { margin-bottom: 0; }
.ledger-summary-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-shrink: 0;
}
.ledger-summary-amount {
  font-size: 13px;
  font-weight: 800;
  color: #059669;
}
.ledger-summary-count {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}
.ledger-record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.ledger-record-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}
.ledger-record-item:active { background: #f1f5f9; }
.ledger-record-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.lr-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lr-amount {
  font-size: 14px;
  font-weight: 800;
  color: #1f2937;
  flex-shrink: 0;
}
.lr-date {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}
.ledger-empty {
  padding: 18px 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 12px;
}
.ledger-records-hint {
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ledger-records-hint text {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}
.ledger-records-hint-sub {
  font-size: 11px !important;
  font-weight: 500 !important;
  color: #94a3b8 !important;
}
.ledger-actions {
  display: flex;
  gap: 10px;
}
.ledger-action-btn {
  flex: 1;
  height: 42px;
  border-radius: 14px;
  background: var(--primary-soft, #eef2ff);
  color: var(--primary-color, #4f46e5);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ledger-action-btn.ghost {
  background: #fff;
  color: #64748b;
  border: 1px solid #e2e8f0;
}
</style>
