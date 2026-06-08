<template>
  <view
    class="task-line"
    :class="[
      lineClass,
      {
        'is-last': isLast,
        'is-completing': completingId === task.id,
        'is-complete-sweep': completingId === task.id && completePhase === 'sweep',
        'is-complete-done': completingId === task.id && completePhase === 'done',
        'is-completed': completed
      }
    ]"
    :style="staggerStyle"
    @tap="handleLineTap"
  >
    <view
      v-if="!completed"
      class="line-check"
      :class="{ checked: completingId === task.id }"
      @tap.stop="$emit('complete', task)"
    >
      <text v-if="completingId === task.id" class="check-mark">✓</text>
    </view>
    <view v-else class="line-check checked static-check done-check">
      <text class="check-mark">✓</text>
    </view>

    <view class="line-body" :class="{ 'line-body-dim': completingId === task.id }">
      <view class="line-top task-head">
        <text class="line-title task-title">{{ task.title }}</text>
        <view class="task-head-right">
          <text
            v-if="task.ledgerAmountDisplay"
            class="task-amount"
            @tap.stop="handleLedgerTap"
          >¥{{ task.ledgerAmountDisplay }}</text>
          <view class="line-more" @tap.stop="$emit('more', task)">{{ moreIcon }}</view>
        </view>
      </view>
      <view v-if="hasStatusMeta" class="task-meta-line">
        <template v-if="completed">
          <text v-if="statusMetaLabel" class="task-meta-text">{{ statusMetaLabel }}</text>
          <template v-if="showLedgerRecorded">
            <text class="task-meta-sep"> · </text>
            <text class="task-meta-ledger" @tap.stop="handleLedgerTap">{{ task.ledgerRecordLabel }}</text>
          </template>
          <template v-if="task.assigneeDisplayName">
            <text class="task-meta-sep"> · </text>
            <text class="task-meta-text">{{ task.assigneeDisplayName }}</text>
          </template>
        </template>
        <template v-else>
          <text v-if="task.assigneeDisplayName" class="task-meta-text">{{ task.assigneeDisplayName }}</text>
          <text v-else-if="statusMetaLabel" class="task-meta-text">{{ statusMetaLabel }}</text>
          <template v-if="showLedgerRecorded">
            <text class="task-meta-sep"> · </text>
            <text class="task-meta-ledger" @tap.stop="handleLedgerTap">{{ task.ledgerRecordLabel }}</text>
          </template>
        </template>
      </view>
      <view
        v-if="!completed && hasScheduleRow"
        class="task-schedule-line"
      >
        <text v-if="task.showScheduleUrgent" class="task-schedule-urgent">紧急</text>
        <text v-if="task.showScheduleUrgent && task.scheduleDatePart" class="task-schedule-sep"> · </text>
        <text
          v-if="task.scheduleDatePart"
          class="task-schedule-date"
          :class="{ overdue: task.isScheduleOverdue }"
        >{{ task.scheduleDatePart }}</text>
      </view>
      <text v-if="task.sublineText" class="task-note-line">{{ task.sublineText }}</text>
    </view>

    <view v-if="completingId === task.id && completePhase === 'sweep'" class="complete-sweep"></view>
    <view v-if="completingId === task.id && completePhase === 'done'" class="complete-badge">完成</view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { coalesce } from '@/common/utils/coalesce.js'

const props = defineProps({
  task: { type: Object, required: true },
  completingId: { type: [String, Number, null], default: null },
  completePhase: { type: String, default: '' },
  isLast: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  moreIcon: { type: String, default: '›' },
  staggerIndex: { type: Number, default: -1 },
  roomId: { type: [String, Number], default: '' },
  accountId: { type: [String, Number], default: '' }
})

const emit = defineEmits(['tap', 'complete', 'more', 'ledger'])

const showLedgerRecorded = computed(() => (coalesce(props.task && props.task.recordCount, 0)) > 0)

const statusMetaLabel = computed(() =>
  props.task?.statusLabel ||
  props.task?.completedLabel ||
  (props.completed ? '完成 · 近期' : '进行中')
)

const hasStatusMeta = computed(() =>
  !!(props.task?.assigneeDisplayName || statusMetaLabel.value || showLedgerRecorded.value)
)

const hasScheduleRow = computed(() =>
  !props.completed && !!(props.task?.showScheduleUrgent || props.task?.scheduleDatePart)
)

function handleLedgerTap() {
  const recordCount = coalesce(props.task && props.task.recordCount, 0)
  if (recordCount > 1) {
    emit('ledger', props.task)
    return
  }
  if (recordCount === 1) {
    const ledgerId = coalesce(
      props.task && props.task.ledgerPrimaryId,
      props.task && props.task.ledgerTaskId
    )
    if (ledgerId && props.roomId && props.accountId) {
      uni.navigateTo({
        url: `/pages/add-entry/add-entry?roomId=${props.roomId}&accountId=${props.accountId}&id=${ledgerId}`
      })
      return
    }
  }
  emit('ledger', props.task)
}

function handleLineTap() {
  if (props.completed) {
    emit('more', props.task)
    return
  }
  emit('tap', props.task)
}

const lineClass = computed(() => {
  if (props.completed) return 'bucket-completed'
  return ''
})

const staggerStyle = computed(() =>
  props.staggerIndex >= 0 ? { animationDelay: `${props.staggerIndex * 0.04}s` } : {}
)
</script>

<style scoped>
.task-line {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 14px;
  border-bottom: 1px solid #f1f5f9;
  overflow: hidden;
  transition: opacity 0.25s, transform 0.25s, background 0.15s;
}
.task-line.is-last { border-bottom: none; }
.task-line:active:not(.is-completing) { background: #f8fafc; }
.task-line.bucket-completed {
  background: transparent;
  border-bottom-color: #f1f5f9;
}
.task-line.bucket-completed:active { background: #f8fafc; }
.task-line.is-completing { pointer-events: none; }
.task-line.is-complete-sweep .line-body-dim { opacity: 0.72; }
.task-line.is-complete-done .line-body-dim { opacity: 0.2; }

.complete-sweep {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.1) 55%, rgba(16, 185, 129, 0.02) 100%);
  transform: scaleX(0);
  transform-origin: left center;
  animation: completeSweep 0.56s ease forwards;
  z-index: 2;
  pointer-events: none;
}
.complete-badge {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 3;
  font-size: 13px;
  font-weight: 800;
  color: #10b981;
  letter-spacing: 1px;
  animation: completeBadgeIn 0.22s ease;
}
@keyframes completeSweep {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes completeBadgeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.line-check {
  position: relative;
  z-index: 4;
  width: 20px;
  height: 20px;
  border-radius: 7px;
  border: 2px solid #cbd5e1;
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.line-check.checked {
  border-color: #10b981;
  background: #10b981;
}
.line-check.done-check {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  margin-top: 1px;
  box-shadow: none;
}
.task-line.bucket-completed .line-check.checked {
  border-color: #10b981;
  background: #10b981;
}
.line-check.static-check { pointer-events: none; }
.check-mark {
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}
.line-body-dim { position: relative; z-index: 1; transition: opacity 0.2s ease; }
.line-check:active:not(.checked):not(.static-check) { border-color: #10b981; background: #d1fae5; }

.line-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.task-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.task-head-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
  margin-left: auto;
}
.task-title {
  color: #1f2937;
  font-size: 15px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}
.task-amount {
  font-size: 14px;
  font-weight: 600;
  color: #059669;
  line-height: 1;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.task-meta-line {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 0;
  overflow: hidden;
}
.task-meta-text {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}
.task-meta-sep {
  font-size: 11px;
  font-weight: 400;
  color: #cbd5e1;
  line-height: 1.35;
  flex-shrink: 0;
}
.task-meta-ledger {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  line-height: 1.35;
  flex-shrink: 0;
}
.task-schedule-line {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 0;
  overflow: hidden;
}
.task-schedule-urgent {
  font-size: 11px;
  font-weight: 600;
  color: #e11d48;
  line-height: 1.35;
  flex-shrink: 0;
}
.task-schedule-sep {
  font-size: 11px;
  font-weight: 400;
  color: #cbd5e1;
  line-height: 1.35;
  flex-shrink: 0;
}
.task-schedule-date {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}
.task-schedule-date.overdue {
  color: #dc2626;
}
.task-note-line {
  display: block;
  font-size: 11px;
  font-weight: 400;
  color: #a8b3c3;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line-more {
  font-size: 16px;
  color: #cbd5e1;
  font-weight: 400;
  line-height: 1;
  padding: 0 2px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
}
</style>
