<template>
  <view :class="themeClass" class="import-root" :style="themeStyles">
    <IosNav
      :title="navTitle"
      @leftClick="onNavBack"
      :rightText="step === 'preview' ? '全选' : ''"
      @rightClick="toggleSelectAllImportable"
    />

    <!-- 步骤 1：选择来源 & 上传 -->
    <scroll-view v-if="step === 'upload'" scroll-y class="main-scroll" :show-scrollbar="false">
      <view class="step-inner">
        <view class="hero-card animate-fade-in">
          <text class="hero-title">导入微信 / 支付宝账单</text>
          <text class="hero-desc">上传官方导出文件，先预览再确认入库，重复交易会自动识别。</text>
        </view>

        <view class="section-label">选择账单来源</view>
        <view class="source-grid">
          <view
            v-for="item in sourceOptions"
            :key="item.code"
            class="source-card"
            :class="{ active: billSource === item.code }"
            @click="billSource = item.code"
          >
            <text class="source-icon">{{ item.icon }}</text>
            <text class="source-name">{{ item.name }}</text>
            <text class="source-hint">{{ item.hint }}</text>
          </view>
        </view>

        <view v-if="currentSourceTip" class="tip-card">
          <text class="tip-title">导出路径</text>
          <text class="tip-body">{{ currentSourceTip }}</text>
        </view>

        <view class="upload-zone" @click="pickBillFile">
          <view class="upload-icon-wrap">
            <text class="upload-icon">📄</text>
          </view>
          <text class="upload-title">{{ selectedFileName || '点击选择账单文件' }}</text>
          <text class="upload-sub">支持 .csv / .xlsx</text>
        </view>

        <button
          class="primary-btn"
          :class="{ disabled: !canPreview }"
          :disabled="!canPreview || isPreviewing"
          @click="runPreview"
        >
          {{ isPreviewing ? '解析中...' : '解析并预览' }}
        </button>
      </view>
    </scroll-view>

    <!-- 步骤 2：预览 & 编辑 -->
    <view v-else-if="step === 'preview'" class="preview-layout">
      <view class="preview-summary">
        <view class="summary-main">
          <text class="summary-source">{{ previewMeta.sourceName || '账单' }}</text>
          <text class="summary-total">共 {{ previewMeta.total || 0 }} 条记录</text>
        </view>
        <view class="summary-metrics">
          <view class="metric-item ok">
            <text class="metric-num">{{ previewMeta.importable || 0 }}</text>
            <text class="metric-label">可导入</text>
          </view>
          <view class="metric-divider"></view>
          <view class="metric-item">
            <text class="metric-num">{{ previewMeta.duplicate || 0 }}</text>
            <text class="metric-label">重复</text>
          </view>
          <view v-if="reviewCount" class="metric-divider"></view>
          <view v-if="reviewCount" class="metric-item warn">
            <text class="metric-num">{{ reviewCount }}</text>
            <text class="metric-label">待检查</text>
          </view>
        </view>
      </view>

      <view class="filter-row">
        <view
          class="filter-chip"
          :class="{ active: listFilter === 'all' }"
          @click="listFilter = 'all'"
        >全部</view>
        <view
          class="filter-chip"
          :class="{ active: listFilter === 'review' }"
          @click="listFilter = 'review'"
        >待检查</view>
        <view
          class="filter-chip"
          :class="{ active: listFilter === 'duplicate' }"
          @click="listFilter = 'duplicate'"
        >重复</view>
      </view>

      <scroll-view v-if="activeMerchantHints.length" scroll-x class="hint-scroll" :show-scrollbar="false">
        <view class="hint-row">
          <view v-for="(hint, idx) in activeMerchantHints" :key="idx" class="hint-card">
            <text class="hint-msg">{{ hint.hintMessage }}</text>
            <view
              v-if="hint.suggestedCategoryId"
              class="hint-action"
              @click="applyHint(hint)"
            >
              <text>应用到同商户</text>
            </view>
            <text v-else class="hint-tip">修改其中一条分类后可批量应用</text>
          </view>
        </view>
      </scroll-view>

      <scroll-view scroll-y class="preview-list" :show-scrollbar="false">
        <view class="list-inner">
          <view
            v-for="row in filteredRows"
            :key="row.index"
            class="preview-row"
            :class="{
              duplicate: row.status === 'duplicate',
              review: row.needsReview,
              fallback: row.categorySource === 'fallback'
            }"
          >
            <view class="row-top">
              <view
                class="row-check"
                :class="{ checked: row.selected, disabled: row.status === 'duplicate' }"
                @click="toggleRowSelect(row)"
              >
                <text v-if="row.selected" class="check-mark">✓</text>
              </view>

              <view class="row-body">
                <view class="row-title-row">
                  <text class="row-counterparty">{{ displayRowCounterparty(row) }}</text>
                  <view class="type-pill" :class="row.type">
                    <text>{{ row.type === 'income' ? '收入' : '支出' }}</text>
                  </view>
                </view>

                <view class="row-amount-row">
                  <text class="row-amount" :class="row.type">
                    {{ row.type === 'income' ? '+' : '-' }}¥{{ formatPrice(row.amount) }}
                  </text>
                  <text class="meta-time">{{ formatDate(row.entryTime, 'MM/dd HH:mm') }}</text>
                </view>

                <text class="row-product">{{ sanitizeText(row.product) || sanitizeText(row.note) || '—' }}</text>

                <view v-if="row.status === 'duplicate' || getCategorySourceTag(row.categorySource) || (row.needsReview && row.reviewHint)" class="row-tags">
                  <text v-if="row.status === 'duplicate'" class="tag duplicate-tag">{{ row.statusMessage || '已导入' }}</text>
                  <text v-else-if="getCategorySourceTag(row.categorySource)" class="tag" :class="row.categorySource">
                    {{ getCategorySourceTag(row.categorySource) }}
                  </text>
                  <text v-if="row.needsReview && row.reviewHint" class="review-hint">{{ row.reviewHint }}</text>
                </view>
              </view>
            </view>

            <view v-if="row.status !== 'duplicate'" class="row-edit">
              <view class="edit-field full" @click="openCategoryPicker(row)">
                <view class="field-top">
                  <text class="field-label">分类</text>
                  <text class="field-arrow">›</text>
                </view>
                <text class="field-value">{{ displayCategory(row) }}</text>
              </view>
              <view class="edit-field full" @click="openPayPicker(row)">
                <view class="field-top">
                  <text class="field-label">支付方式</text>
                  <text class="field-arrow">›</text>
                </view>
                <text class="field-value">{{ displayPay(row) }}</text>
              </view>
            </view>
          </view>

          <view v-if="filteredRows.length === 0" class="empty-preview">
            <text class="empty-txt">当前筛选下暂无记录</text>
          </view>
          <view class="list-bottom-spacer"></view>
        </view>
      </scroll-view>

      <view class="bottom-bar">
        <view class="remember-row">
          <switch :checked="rememberMerchantRules" color="var(--primary-color, #4F46E5)" @change="onRememberChange" />
          <text class="remember-txt">记住我修改过的商户分类</text>
        </view>
        <button
          class="primary-btn confirm-btn"
          :class="{ disabled: selectedCount === 0 || isConfirming }"
          :disabled="selectedCount === 0 || isConfirming"
          @click="runConfirm"
        >
          {{ isConfirming ? '导入中...' : `确认导入 ${selectedCount} 条` }}
        </button>
      </view>
    </view>

    <!-- 步骤 3：结果 -->
    <view v-else-if="step === 'result'" class="result-layout animate-fade-in">
      <view class="result-icon-wrap">
        <text class="result-icon">✅</text>
      </view>
      <text class="result-title">导入完成</text>
      <text class="result-message">{{ importResult.message || '账单已成功写入账本' }}</text>
      <view class="result-stats">
        <view class="result-stat">
          <text class="rs-val">{{ importResult.imported != null ? importResult.imported : 0 }}</text>
          <text class="rs-label">成功</text>
        </view>
        <view class="result-stat">
          <text class="rs-val">{{ importResult.duplicate != null ? importResult.duplicate : 0 }}</text>
          <text class="rs-label">重复</text>
        </view>
        <view class="result-stat">
          <text class="rs-val">{{ importResult.skipped != null ? importResult.skipped : 0 }}</text>
          <text class="rs-label">跳过</text>
        </view>
        <view class="result-stat">
          <text class="rs-val">{{ importResult.failed != null ? importResult.failed : 0 }}</text>
          <text class="rs-label">失败</text>
        </view>
      </view>
      <button class="primary-btn" @click="finishImport">查看流水</button>
      <button class="ghost-btn" @click="resetImport">继续导入</button>
    </view>

    <CategoryPicker
      v-model="showCategoryPicker"
      title="修改分类"
      :options="categories"
      :transactionType="(editingRow && editingRow.type) || 'expense'"
      :currentSelected="editingRow && editingRow.editedCategoryId"
      @change="onCategoryPicked"
    />

    <BottomPicker
      v-model="showPayPicker"
      title="支付方式"
      layout="list"
      :options="payOptions"
      :currentSelected="editingRow && editingRow.editedPayId != null ? String(editingRow.editedPayId) : ''"
      @change="onPayPicked"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import IosNav from '../../components/nav/ios-nav.vue'
import CategoryPicker from '../../components/common/CategoryPicker.vue'
import BottomPicker from '../../components/common/BottomPicker.vue'
import { ledgerImportApi, taskApi } from '../../common/api'
import { coalesce } from '../../common/utils/coalesce.js'
import { useAppTheme } from '@/common/themes/useAppTheme.js'
import { formatDate, formatPrice } from '../../pages/js/utils.js'
import {
  toEditableRow,
  toConfirmRow,
  applyMerchantSuggestion,
  applyCategoryToMerchantRows,
  countMerchantPendingRows,
  countReviewRows,
  recomputeMerchantHints,
  markRowCategoryResolved,
  getCategorySourceTag,
  getApiMessage,
  displayRowCounterparty,
  getRowMerchantKey,
  sanitizeText
} from '../../common/utils/ledgerImport.js'

const { themeClass, themeStyles } = useAppTheme()

const roomId = ref(null)
const accountId = ref(null)
const step = ref('upload') // upload | preview | result
const billSource = ref('wechat')
const selectedFilePath = ref('')
const selectedFileName = ref('')
const isPreviewing = ref(false)
const isConfirming = ref(false)
const rememberMerchantRules = ref(true)
const listFilter = ref('all')

const previewMeta = ref({})
const merchantHints = ref([])
const editableRows = ref([])
const importResult = ref({})

const reviewCount = computed(() => countReviewRows(editableRows.value))

const activeMerchantHints = computed(() =>
  recomputeMerchantHints(editableRows.value, merchantHints.value)
)

const categories = ref([])
const payOptions = ref([])
const showCategoryPicker = ref(false)
const showPayPicker = ref(false)
const editingRow = ref(null)

const sourceOptions = [
  {
    code: 'wechat',
    name: '微信支付',
    icon: '💬',
    hint: '微信官方账单',
    exportTip: '微信 → 我 → 服务 → 钱包 → 账单 → 右上角 ··· → 导出账单'
  },
  {
    code: 'alipay',
    name: '支付宝',
    icon: '💙',
    hint: '支付宝官方账单',
    exportTip: '支付宝 → 我的 → 账单 → 右上角 ··· → 导出'
  }
]

const navTitle = computed(() => {
  if (step.value === 'upload') return '账单导入'
  if (step.value === 'preview') return '预览与确认'
  return '导入结果'
})

const currentSourceTip = computed(() => {
  const source = sourceOptions.find((s) => s.code === billSource.value)
  return (source && source.exportTip) || ''
})

const canPreview = computed(() => !!selectedFilePath.value && roomId.value && accountId.value)

const filteredRows = computed(() => {
  const rows = editableRows.value || []
  if (listFilter.value === 'review') return rows.filter((r) => r.needsReview)
  if (listFilter.value === 'duplicate') return rows.filter((r) => r.status === 'duplicate')
  return rows
})

const selectedCount = computed(() =>
  editableRows.value.filter((r) => r.selected && r.status === 'importable').length
)

onLoad((e) => {
  roomId.value = e.roomId
  accountId.value = e.accountId
})

onMounted(() => {
  loadCategoryData()
})

const loadCategoryData = async () => {
  try {
    const [expRes, incRes, payRes] = await Promise.all([
      ledgerImportApi.getCategoryTree('expense').catch(() => null),
      ledgerImportApi.getCategoryTree('income').catch(() => null),
      ledgerImportApi.getPayMethods()
    ])
    const merged = []
    if (expRes && expRes.code === 0 && Array.isArray(expRes.data)) merged.push(...expRes.data)
    if (incRes && incRes.code === 0 && Array.isArray(incRes.data)) merged.push(...incRes.data)
    if (merged.length) {
      categories.value = merged
    } else {
      const fallback = await taskApi.getcategoryList({})
      if (fallback.code === 0) categories.value = fallback.data || []
    }
    if (payRes.code === 0) {
      payOptions.value = (payRes.data || []).map((p) => ({
        ...p,
        label: p.label || p.name
      }))
    }
  } catch (e) {}
}

const pickBillFile = () => {
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['csv', 'xlsx'],
    success: (res) => {
      const file = res.tempFiles && res.tempFiles[0]
      if (!file) return
      selectedFilePath.value = file.path
      selectedFileName.value = file.name || '已选择文件'
    },
    fail: () => {
      uni.showToast({ title: '未选择文件', icon: 'none' })
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.chooseFile({
    count: 1,
    extension: ['.csv', '.xlsx'],
    success: (res) => {
      const file = res.tempFiles && res.tempFiles[0]
      if (!file) return
      selectedFilePath.value = file.tempFilePath || file.path
      selectedFileName.value = file.name || '已选择文件'
    },
    fail: () => {
      uni.showToast({ title: '未选择文件', icon: 'none' })
    }
  })
  // #endif
}

const runPreview = async () => {
  if (!canPreview.value || isPreviewing.value) return
  isPreviewing.value = true
  try {
    const res = await ledgerImportApi.preview(
      selectedFilePath.value,
      roomId.value,
      accountId.value
    )
    if (res.code !== 0) {
      uni.showToast({ title: getApiMessage(res), icon: 'none', duration: 3000 })
      return
    }
    const data = res.data || {}
    previewMeta.value = data
    merchantHints.value = data.merchantHints || []
    editableRows.value = (data.rows || []).map(toEditableRow)
    if (data.source) billSource.value = data.source
    step.value = 'preview'
  } catch (e) {
    uni.showToast({ title: e.message || '解析失败', icon: 'none' })
  } finally {
    isPreviewing.value = false
  }
}

const toggleRowSelect = (row) => {
  if (row.status === 'duplicate') return
  row.selected = !row.selected
}

const toggleSelectAllImportable = () => {
  if (step.value !== 'preview') return
  const importable = editableRows.value.filter((r) => r.status === 'importable')
  const allSelected = importable.length > 0 && importable.every((r) => r.selected)
  importable.forEach((r) => { r.selected = !allSelected })
}

const applyHint = (hint) => {
  const { rows, count } = applyMerchantSuggestion(editableRows.value, hint)
  editableRows.value = rows
  if (count > 0) {
    uni.showToast({ title: `已替换 ${count} 条`, icon: 'success' })
  }
}

const syncPreviewStats = () => {
  previewMeta.value = {
    ...previewMeta.value,
    reviewCount: countReviewRows(editableRows.value)
  }
}

const displayCategory = (row) =>
  sanitizeText(row.editedCategoryLabel) ||
  sanitizeText(row.categoryLabel) ||
  '请选择分类'

const displayPay = (row) =>
  sanitizeText(row.editedPayLabel) ||
  sanitizeText(row.payLabel) ||
  sanitizeText(row.payMethod) ||
  '请选择'

const openCategoryPicker = (row) => {
  editingRow.value = row
  showCategoryPicker.value = true
}

const openPayPicker = (row) => {
  editingRow.value = row
  showPayPicker.value = true
}

const buildCategoryLabel = (item) => {
  if (!item) return ''
  const parent = categories.value.find((c) => c.id === item.parentId)
  if (parent) return `${parent.label}/${item.label}`
  return item.label || ''
}

const onCategoryPicked = (item) => {
  if (!editingRow.value || !item) return

  const row = editingRow.value
  const categoryId = item.id
  const categoryLabel = buildCategoryLabel(item)
  const merchantName = displayRowCounterparty(row)
  const merchantKey = getRowMerchantKey(row)
  const rowIndex = row.index

  Object.assign(row, markRowCategoryResolved(row, categoryId, categoryLabel))
  editingRow.value = null
  syncPreviewStats()

  const pending = countMerchantPendingRows(editableRows.value, merchantKey, rowIndex)
  if (pending <= 0) return

  uni.showModal({
    title: '批量应用分类',
    content: `同商户「${merchantName}」还有 ${pending} 条记录可应用「${categoryLabel}」，是否全部替换？`,
    confirmText: '全部应用',
    cancelText: '仅本条',
    success: (res) => {
      if (!res.confirm) return
      const { rows, count } = applyCategoryToMerchantRows(
        editableRows.value,
        merchantKey,
        categoryId,
        categoryLabel,
        rowIndex
      )
      editableRows.value = rows
      syncPreviewStats()
      uni.showToast({ title: `已替换 ${count} 条`, icon: 'success' })
    }
  })
}

const onPayPicked = (item) => {
  if (!editingRow.value || !item) return
  editingRow.value.editedPayId = item.id
  editingRow.value.editedPayLabel = item.label
  editingRow.value = null
}

const onRememberChange = (e) => {
  rememberMerchantRules.value = !!e.detail.value
}

const runConfirm = async () => {
  const selected = editableRows.value.filter((r) => r.selected && r.status === 'importable')
  if (!selected.length || isConfirming.value) return

  const invalid = selected.find((r) => !coalesce(r.editedCategoryId, r.categoryId))
  if (invalid) {
    uni.showToast({ title: '请为所有勾选记录选择分类', icon: 'none' })
    return
  }

  isConfirming.value = true
  try {
    const res = await ledgerImportApi.confirm({
      roomId: Number(roomId.value),
      accountId: Number(accountId.value),
      skipDuplicates: true,
      rememberMerchantRules: rememberMerchantRules.value,
      rows: selected.map(toConfirmRow)
    })
    if (res.code !== 0) {
      uni.showToast({ title: getApiMessage(res), icon: 'none', duration: 3000 })
      return
    }
    importResult.value = res.data || {}
    step.value = 'result'
    uni.$emit('refresh_ledger_data')
  } catch (e) {
    uni.showToast({ title: e.message || '导入失败', icon: 'none' })
  } finally {
    isConfirming.value = false
  }
}

const finishImport = () => {
  uni.redirectTo({
    url: `/pages/ledger-all/ledger-all?roomId=${roomId.value}&accountId=${accountId.value}`
  })
}

const resetImport = () => {
  step.value = 'upload'
  selectedFilePath.value = ''
  selectedFileName.value = ''
  previewMeta.value = {}
  merchantHints.value = []
  editableRows.value = []
  importResult.value = {}
  listFilter.value = 'all'
}

const onNavBack = () => {
  if (step.value === 'preview') {
    uni.showModal({
      title: '返回上传',
      content: '预览数据尚未提交，返回将丢失当前编辑内容',
      success: (res) => {
        if (res.confirm) step.value = 'upload'
      }
    })
    return
  }
  if (step.value === 'result') {
    finishImport()
    return
  }
  uni.navigateBack()
}
</script>

<style scoped>
.import-root {
  width: 100%;
  height: 100vh;
  background: var(--primary-soft, #F8FAFC);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.main-scroll { flex: 1; height: 0; width: 100%; box-sizing: border-box; }
.step-inner { padding: 16px 20px 40px; box-sizing: border-box; }

.hero-card {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}
.hero-title { display: block; font-size: 20px; font-weight: 900; color: #0F172A; margin-bottom: 8px; }
.hero-desc { display: block; font-size: 13px; color: #64748B; line-height: 1.6; }

.section-label {
  font-size: 12px;
  font-weight: 800;
  color: #94A3B8;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.source-grid { display: flex; gap: 12px; margin-bottom: 20px; }
.source-card {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 20px;
  padding: 18px 14px;
  border: 2px solid transparent;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  box-sizing: border-box;
}
.source-card.active {
  border-color: var(--primary-color, #4F46E5);
  background: rgba(79, 70, 229, 0.04);
}
.source-icon { font-size: 28px; display: block; margin-bottom: 8px; }
.source-name { display: block; font-size: 15px; font-weight: 800; color: #0F172A; }
.source-hint { display: block; font-size: 11px; color: #94A3B8; margin-top: 4px; }

.tip-card {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 20px;
  box-sizing: border-box;
}
.tip-title { display: block; font-size: 12px; font-weight: 800; color: #B45309; margin-bottom: 6px; }
.tip-body { display: block; font-size: 13px; color: #92400E; line-height: 1.5; word-break: break-all; }

.upload-zone {
  background: #fff;
  border: 2px dashed #CBD5E1;
  border-radius: 20px;
  padding: 32px 20px;
  text-align: center;
  margin-bottom: 24px;
  box-sizing: border-box;
}
.upload-icon-wrap {
  width: 56px; height: 56px; border-radius: 16px;
  background: var(--primary-soft, #EEF2FF);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
}
.upload-icon { font-size: 28px; }
.upload-title {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: #0F172A;
  word-break: break-all;
  padding: 0 8px;
}
.upload-sub { display: block; font-size: 12px; color: #94A3B8; margin-top: 6px; }

.primary-btn {
  width: 100%;
  height: 52px;
  line-height: 52px;
  background: var(--primary-color, #4F46E5);
  color: #fff;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 800;
  border: none;
  box-sizing: border-box;
}
.primary-btn.disabled { opacity: 0.45; }
.ghost-btn {
  width: 100%;
  height: 48px;
  line-height: 48px;
  background: transparent;
  color: #64748B;
  border: none;
  font-size: 14px;
  font-weight: 700;
  margin-top: 12px;
}

.preview-layout {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.preview-summary {
  margin: 12px 16px 0;
  padding: 16px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  box-sizing: border-box;
}
.summary-main { margin-bottom: 14px; }
.summary-source {
  display: block;
  font-size: 16px;
  font-weight: 900;
  color: #0F172A;
}
.summary-total {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #94A3B8;
  font-weight: 700;
}
.summary-metrics {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border-radius: 14px;
  padding: 12px 8px;
}
.metric-item {
  flex: 1;
  text-align: center;
  min-width: 0;
}
.metric-item.ok .metric-num { color: #10B981; }
.metric-item.warn .metric-num { color: #F59E0B; }
.metric-num {
  display: block;
  font-size: 20px;
  font-weight: 900;
  color: #0F172A;
  line-height: 1.2;
}
.metric-label {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  color: #94A3B8;
  font-weight: 800;
}
.metric-divider {
  width: 1px;
  height: 28px;
  background: #E2E8F0;
  flex-shrink: 0;
}

.filter-row {
  display: flex;
  gap: 8px;
  padding: 12px 16px 8px;
  box-sizing: border-box;
}
.filter-chip {
  padding: 7px 16px;
  border-radius: 100px;
  background: #fff;
  font-size: 12px;
  font-weight: 800;
  color: #64748B;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}
.filter-chip.active {
  background: var(--primary-color, #4F46E5);
  color: #fff;
  box-shadow: 0 4px 12px var(--primary-glow, rgba(79, 70, 229, 0.25));
}

.hint-scroll {
  width: 100%;
  white-space: nowrap;
  padding: 0 16px 8px;
  box-sizing: border-box;
}
.hint-row { display: inline-flex; gap: 10px; padding-right: 16px; }
.hint-card {
  width: 240px;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border-radius: 14px;
  padding: 12px;
  white-space: normal;
  display: inline-block;
  box-sizing: border-box;
}
.hint-msg { display: block; font-size: 12px; color: #92400E; line-height: 1.5; word-break: break-all; }
.hint-action {
  margin-top: 8px;
  display: inline-flex;
  padding: 5px 12px;
  background: #F59E0B;
  border-radius: 8px;
}
.hint-action text { font-size: 11px; font-weight: 800; color: #fff; }
.hint-tip {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  color: #B45309;
  font-weight: 700;
}

.preview-list {
  flex: 1;
  width: 100%;
  height: 0;
  box-sizing: border-box;
}
.list-inner {
  padding: 4px 16px 0;
  box-sizing: border-box;
}
.list-bottom-spacer { height: 140px; }

.preview-row {
  width: 100%;
  background: #fff;
  border-radius: 18px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  box-sizing: border-box;
  overflow: hidden;
}
.preview-row.duplicate { opacity: 0.55; }
.preview-row.review {
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.18), 0 4px 16px rgba(245, 158, 11, 0.08);
}
.preview-row.fallback {
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.16), 0 4px 16px rgba(239, 68, 68, 0.06);
}

.row-top {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
  box-sizing: border-box;
}
.row-check {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 2px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 3px;
  box-sizing: border-box;
}
.row-check.checked {
  background: var(--primary-color, #4F46E5);
  border-color: var(--primary-color, #4F46E5);
}
.row-check.disabled { opacity: 0.35; }
.check-mark { color: #fff; font-size: 11px; font-weight: 900; }

.row-body {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.row-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.row-counterparty {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 800;
  color: #0F172A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.type-pill {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 800;
}
.type-pill.income { background: #FEE2E2; color: #DC2626; }
.type-pill.expense { background: #D1FAE5; color: #059669; }
.type-pill text { font-size: 10px; font-weight: 800; }

.row-amount-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  width: 100%;
}
.row-amount {
  font-size: 18px;
  font-weight: 900;
  flex-shrink: 0;
}
.row-amount.income { color: #EF4444; }
.row-amount.expense { color: #10B981; }
.meta-time {
  font-size: 11px;
  color: #94A3B8;
  font-weight: 700;
  flex-shrink: 0;
}

.row-product {
  display: block;
  font-size: 12px;
  color: #64748B;
  margin-top: 6px;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.row-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 8px;
  width: 100%;
}
.tag {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  background: #EEF2FF;
  color: #4F46E5;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tag.fallback { background: #FEE2E2; color: #DC2626; }
.tag.peer_suggestion { background: #FFFBEB; color: #D97706; }
.tag.merchant_rule { background: #ECFDF5; color: #059669; }
.tag.duplicate-tag { background: #F1F5F9; color: #94A3B8; }
.review-hint {
  font-size: 10px;
  color: #D97706;
  line-height: 1.4;
  word-break: break-all;
}

.row-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
  width: 100%;
  box-sizing: border-box;
}
.edit-field {
  width: 100%;
  background: #F8FAFC;
  border-radius: 12px;
  padding: 10px 12px;
  box-sizing: border-box;
  overflow: hidden;
}
.edit-field.full { width: 100%; }
.field-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.field-label { font-size: 10px; color: #94A3B8; font-weight: 800; }
.field-value {
  display: block;
  font-size: 13px;
  color: #0F172A;
  font-weight: 700;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
.field-arrow { font-size: 14px; color: #CBD5E1; flex-shrink: 0; }

.bottom-bar {
  width: 100%;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #EEF2FF;
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
  flex-shrink: 0;
}
.remember-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.remember-txt { font-size: 12px; color: #64748B; font-weight: 700; flex: 1; }
.confirm-btn { margin: 0; }

.empty-preview { padding: 40px 16px; text-align: center; }
.empty-txt { font-size: 13px; color: #94A3B8; }

.result-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  box-sizing: border-box;
}
.result-icon-wrap {
  width: 80px; height: 80px; border-radius: 50%;
  background: #ECFDF5;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.result-icon { font-size: 40px; }
.result-title { font-size: 22px; font-weight: 900; color: #0F172A; margin-bottom: 8px; }
.result-message { font-size: 14px; color: #64748B; text-align: center; line-height: 1.6; margin-bottom: 24px; }
.result-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  width: 100%;
  justify-content: center;
}
.result-stat { text-align: center; min-width: 56px; }
.rs-val { display: block; font-size: 22px; font-weight: 900; color: #0F172A; }
.rs-label { display: block; font-size: 11px; color: #94A3B8; margin-top: 4px; font-weight: 700; }

.animate-fade-in { animation: fadeIn 0.35s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
