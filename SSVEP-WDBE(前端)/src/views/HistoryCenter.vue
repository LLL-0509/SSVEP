<template>
  <div class="page">
    <div class="header">
      <div>
        <h2>数据中心</h2>
        <div class="sub">历史检测记录 · 趋势分析 · 报告生成（演示）</div>
      </div>
      <div class="header-actions">
        <el-button type="primary" plain @click="refreshMock">刷新演示数据</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane label="历史记录" name="history">
        <el-row :gutter="16" class="stat-row">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-title">历史记录数</div>
              <div class="stat-value">{{ records.length }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-title">平均评分</div>
              <div class="stat-value">{{ avgScore }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-title">最新一次</div>
              <div class="stat-value small">{{ latestTime }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-title">总体趋势</div>
              <div class="stat-value">{{ trendLabel }}</div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-h">评分趋势（示例）</div>
          </template>
          <div ref="trendChartRef" class="chart"></div>
        </el-card>

        <el-card shadow="hover" class="table-card">
          <template #header>
            <div class="card-h">历史检测记录</div>
          </template>

          <div class="filters">
            <el-input v-model="keyword" placeholder="按ID/类型筛选" clearable style="max-width: 240px" />
            <el-select v-model="typeFilter" placeholder="检测类型" clearable style="width: 160px">
              <el-option label="青光眼" value="青光眼" />
              <el-option label="白内障" value="白内障" />
              <el-option label="黄斑病" value="黄斑病" />
            </el-select>
          </div>

          <el-table :data="filteredRecords" style="width: 100%" height="360" stripe>
            <el-table-column prop="id" label="记录ID" min-width="120" show-overflow-tooltip />
            <el-table-column prop="time" label="时间" min-width="180" show-overflow-tooltip />
            <el-table-column prop="type" label="检测类型" min-width="120" />
            <el-table-column label="评分" min-width="90">
              <template #default="scope">
                <span :class="scoreClass(scope.row.score)">{{ scope.row.score }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="risk" label="风险等级" min-width="120" />
            <el-table-column prop="accuracy" label="准确率" min-width="110">
              <template #default="scope">
                {{ (scope.row.accuracy * 100).toFixed(1) }}%
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="200" fixed="right" align="center">
              <template #default="scope">
                <el-space :size="6" wrap class="op-actions">
                  <el-button size="small" type="primary" link @click="openDetail(scope.row)">
                    <el-icon><View /></el-icon>
                    详情
                  </el-button>
                  <el-button size="small" type="success" link @click="goReport(scope.row)">
                    <el-icon><Document /></el-icon>
                    报告
                  </el-button>
                  <el-popconfirm title="确定删除该记录吗？" @confirm="removeRecord(scope.row.id)">
                    <template #reference>
                      <el-button size="small" type="danger" link>
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                    </template>
                  </el-popconfirm>
                </el-space>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-dialog v-model="detailVisible" title="检测详情" width="720px">
          <div v-if="selected" class="detail">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="记录ID">{{ selected.id }}</el-descriptions-item>
              <el-descriptions-item label="时间">{{ selected.time }}</el-descriptions-item>
              <el-descriptions-item label="类型">{{ selected.type }}</el-descriptions-item>
              <el-descriptions-item label="评分">{{ selected.score }}</el-descriptions-item>
              <el-descriptions-item label="风险">{{ selected.risk }}</el-descriptions-item>
              <el-descriptions-item label="准确率">{{ (selected.accuracy * 100).toFixed(1) }}%</el-descriptions-item>
            </el-descriptions>

            <div class="section">
              <div class="section-title">参数设置（示例）</div>
              <el-tag v-for="f in selected.params.frequencies" :key="f" class="tag">{{ f }}Hz</el-tag>
              <div class="params">
                <div>加粗字体：{{ selected.params.boldFont ? '是' : '否' }}</div>
                <div>闪烁文本：{{ selected.params.flickerTexts ? '是' : '否' }}</div>
                <div>闪烁盒子：{{ selected.params.flickerBoxes ? '是' : '否' }}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">建议（示例）</div>
              <ul class="ul">
                <li v-for="(s, idx) in selected.suggestions" :key="idx">{{ s }}</li>
              </ul>
            </div>
          </div>

          <template #footer>
            <el-button @click="detailVisible = false">关闭</el-button>
            <el-button type="primary" @click="selected && goReport(selected)">查看/导出报告</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <el-tab-pane label="导入数据" name="import">
        <!-- 复用原有导入页（LocalData.vue） -->
        <LocalData />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import LocalData from './LocalData.vue'

const route = useRoute()
const router = useRouter()

const activeTab = ref('history')
const keyword = ref('')
const typeFilter = ref('')

// --- 演示数据（后续可替换为后端接口） ---
const records = ref([])
const genMock = () => {
  const now = Date.now()
  const types = ['青光眼', '白内障', '黄斑病']
  const base = [7.5, 9.75, 10.25, 12.25, 14.75]
  const list = Array.from({ length: 10 }).map((_, i) => {
    const t = types[i % types.length]
    const score = Math.max(10, Math.min(95, Math.round(40 + Math.sin(i / 2) * 18 + (Math.random() * 18))))
    const accuracy = Math.max(0.2, Math.min(0.98, (score / 100) + (Math.random() * 0.12 - 0.06)))
    return {
      id: `REC${(1000 + i).toString()}`,
      time: new Date(now - i * 86400000).toLocaleString(),
      type: t,
      score,
      risk: score >= 50 ? '无风险' : score >= 33 ? '中等风险' : '有风险',
      accuracy,
      params: {
        frequencies: base,
        boldFont: i % 2 === 0,
        flickerTexts: true,
        flickerBoxes: i % 3 === 0
      },
      suggestions:
        score >= 50
          ? ['保持良好的用眼习惯', '规律作息，减少熬夜', '建议每年复查一次']
          : score >= 33
          ? ['减少长时间近距离用眼', '增加户外活动', '建议3-6个月复查']
          : ['尽快就医进行专业检查', '遵医嘱治疗与随访', '减少刺激性用眼行为']
    }
  })
  return list
}

const refreshMock = () => {
  records.value = genMock()
  nextTick(() => initTrendChart())
}

// --- 路由 query tab 同步 ---
watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'import') activeTab.value = 'import'
    else activeTab.value = 'history'
  },
  { immediate: true }
)

watch(activeTab, (t) => {
  // 保持 URL 与 tab 一致，方便从侧边栏跳转
  const q = { ...route.query, tab: t }
  router.replace({ query: q })
  nextTick(() => {
    if (t === 'history') initTrendChart()
  })
})

const filteredRecords = computed(() => {
  const k = keyword.value.trim()
  return records.value.filter((r) => {
    const okType = typeFilter.value ? r.type === typeFilter.value : true
    const okKeyword = k ? r.id.includes(k) || r.type.includes(k) : true
    return okType && okKeyword
  })
})

const avgScore = computed(() => {
  if (!records.value.length) return 0
  const s = records.value.reduce((a, b) => a + b.score, 0)
  return Math.round(s / records.value.length)
})

const latestTime = computed(() => (records.value.length ? records.value[0].time : '-'))

const trendLabel = computed(() => {
  if (records.value.length < 2) return '—'
  const first = records.value[records.value.length - 1].score
  const last = records.value[0].score
  const diff = last - first
  if (diff > 5) return '上升'
  if (diff < -5) return '下降'
  return '平稳'
})

const scoreClass = (score) => {
  if (score >= 50) return 'green'
  if (score >= 33) return 'yellow'
  return 'red'
}

const removeRecord = (id) => {
  records.value = records.value.filter((r) => r.id !== id)
  nextTick(() => initTrendChart())
}

// --- 详情弹窗 ---
const detailVisible = ref(false)
const selected = ref(null)
const openDetail = (row) => {
  selected.value = row
  detailVisible.value = true
}

// --- 跳转报告 ---
const goReport = (row) => {
  // 把本次记录存起来，报告页读取
  sessionStorage.setItem('assessmentReport', JSON.stringify(row))
  router.push('/main/EyeHealth/AssessmentReport')
}

// --- 图表 ---
const trendChartRef = ref(null)
let chart = null

const initTrendChart = () => {
  if (!trendChartRef.value) return

  if (chart) {
    chart.dispose()
    chart = null
  }

  chart = echarts.init(trendChartRef.value)

  // 趋势图：按时间从旧到新
  const sorted = [...records.value].slice().reverse()
  const x = sorted.map((r) => r.time.split(' ')[0])
  const y = sorted.map((r) => r.score)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 18, top: 24, bottom: 36 },
    xAxis: {
      type: 'category',
      data: x,
      axisLabel: { rotate: 30 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100
    },
    series: [
      {
        type: 'line',
        data: y,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  })
}

const onResize = () => chart?.resize?.()

onMounted(() => {
  refreshMock()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose?.()
})
</script>

<style scoped>
.page {
  padding: 14px 16px 22px;
  height: 100%;
  overflow: auto;
}

.chart-card,
.table-card {
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.stat-row {
  margin-bottom: 14px;
}

.stat-card {
  height: 92px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-title {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 700;
  color: #303133;
}

.stat-value.small {
  font-size: 14px;
  font-weight: 600;
}

.chart-card {
  margin-bottom: 14px;
}

.table-card {
  margin-bottom: 10px;
}

.card-h {
  font-weight: 700;
  color: #303133;
}

.chart {
  height: 260px;
  width: 100%;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.op-actions {
  justify-content: center;
}

.op-actions :deep(.el-button) {
  padding: 2px 4px;
}

.op-actions :deep(.el-icon) {
  margin-right: 2px;
}

@media (max-width: 900px) {
  .filters {
    flex-wrap: wrap;
  }
}

.green {
  color: #67c23a;
  font-weight: 700;
}

.yellow {
  color: #e6a23c;
  font-weight: 700;
}

.red {
  color: #f56c6c;
  font-weight: 700;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section {
  padding-top: 6px;
}

.section-title {
  font-weight: 700;
  margin-bottom: 8px;
  color: #303133;
}

.tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.params {
  margin-top: 10px;
  display: flex;
  gap: 18px;
  color: #606266;
}

.ul {
  margin: 0;
  padding-left: 18px;
  color: #606266;
}
</style>
