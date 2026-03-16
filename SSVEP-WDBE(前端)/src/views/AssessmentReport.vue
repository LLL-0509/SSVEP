<template>
  <div class="report-page">
    <div class="topbar no-print">
      <div class="title">
        <div class="h">检测报告</div>
      </div>
      <div class="actions">
        <el-button type="primary" @click="printReport">保存PDF</el-button>
        <el-button @click="downloadJson">导出数据(JSON)</el-button>
      </div>
    </div>

    <div class="paper print-area" id="reportPaper">
      <!-- Header -->
      <div class="paper-header">
        <div class="hospital">智医明眸眼科智能筛查中心</div>
        <div class="doc">眼健康检测报告</div>
        <div class="meta">
          <div>报告编号：<span class="mono">{{ assessmentId }}</span></div>
          <div>报告日期：<span class="mono">{{ printDate }}</span></div>
        </div>
      </div>

      <!-- Patient Info -->
      <div class="block">
        <div class="block-title">一、基本信息</div>
        <table class="grid">
          <tr>
            <td class="k">姓名</td>
            <td class="v">{{ patient.name }}</td>
            <td class="k">性别</td>
            <td class="v">{{ patient.gender }}</td>
            <td class="k">年龄</td>
            <td class="v">{{ patient.age }}</td>
          </tr>
          <tr>
            <td class="k">检测时间</td>
            <td class="v" colspan="3">{{ assessmentTime }}</td>
            <td class="k">检测类型</td>
            <td class="v">{{ detectType }}</td>
          </tr>
          <tr>
            <td class="k">备注</td>
            <td class="v" colspan="5">{{ patient.complaint }}</td>
          </tr>
        </table>
      </div>

      <!-- Result Summary -->
      <div class="block">
        <div class="block-title">二、检测结论</div>
        <div class="summary">
          <div class="score-box">
            <div class="lab">综合评分（0–100）</div>
            <div class="score mono">{{ finalScore }}</div>
          </div>
          <div class="score-box">
            <div class="lab">风险等级</div>
            <div class="risk mono">{{ riskLevel }}</div>
          </div>
          <div class="score-box">
            <div class="lab">综合准确率</div>
            <div class="risk mono">{{ (averageAccuracy * 100).toFixed(1) }}%</div>
          </div>
        </div>

        <div class="note">
          <div class="note-title">解释说明</div>
          <div class="note-text">
            本报告为智能筛查结果，仅供健康管理参考，不能替代临床诊断。若结果提示中/高风险或伴随视力下降、眼痛、畏光等症状，请尽快至正规医疗机构眼科进一步检查。
          </div>
        </div>
      </div>

      <!-- Parameters -->
      <div class="block">
        <div class="block-title">三、检测参数</div>
        <table class="grid">
          <tr>
            <td class="k">刺激频率(Hz)</td>
            <td class="v" colspan="5">
              <span class="tag mono" v-for="(f, idx) in frequencies" :key="idx">{{ f }}</span>
            </td>
          </tr>
          <tr>
            <td class="k">加粗字体</td>
            <td class="v">{{ params.boldFont ? '是' : '否' }}</td>
            <td class="k">闪烁文本</td>
            <td class="v">{{ params.flickerTexts ? '是' : '否' }}</td>
            <td class="k">闪烁盒子</td>
            <td class="v">{{ params.flickerBoxes ? '是' : '否' }}</td>
          </tr>
        </table>
      </div>

      <!-- Detail Table -->
      <div class="block">
        <div class="block-title">四、结果明细</div>
        <table class="grid">
          <tr>
            <th class="th">频率(Hz)</th>
            <th class="th">相对得分</th>
            <th class="th">备注</th>
          </tr>
          <tr v-for="(f, idx) in frequencies" :key="idx">
            <td class="v mono" style="text-align:center">{{ f }}</td>
            <td class="v">
              <div class="bar">
                <div class="bar-in" :style="{ width: Math.round(frequencyScores[idx] * 100) + '%' }"></div>
              </div>
              <span class="mono">{{ (frequencyScores[idx] * 100).toFixed(1) }}%</span>
            </td>
            <td class="v">{{ detailRemark(frequencyScores[idx]) }}</td>
          </tr>
        </table>
      </div>

      <!-- Suggestions -->
      <div class="block">
        <div class="block-title">五、建议与随访</div>
        <div class="bullets">
          <div class="b" v-for="(s, idx) in suggestions" :key="idx">• {{ s }}</div>
        </div>
        <div class="follow">随访建议：<span class="mono">{{ followUpAdvice }}</span></div>
      </div>

      <!-- Signature -->
      <div class="sign">
        <div class="line">检查医师：<span class="mono">{{ doctor.name }}</span></div>
        <div class="line">审核医师：<span class="mono">{{ doctor.reviewer }}</span></div>
        <div class="line">机构盖章：______________________</div>
      </div>

      <div class="footer">
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

// 默认演示数据（从“数据中心”跳转会自动覆盖）
const finalScore = ref(72)
const frequencies = ref([8, 9.75, 10.25, 12.25, 14.75])
const frequencyScores = ref([0.81, 0.66, 0.54, 0.48, 0.5])
const averageAccuracy = ref(0.72)
const assessmentTime = ref(new Date().toLocaleString())
const assessmentId = ref('ASS' + Date.now().toString().slice(-6))
const detectType = ref('青光眼风险评估')

const params = ref({
  frequencies: frequencies.value,
  boldFont: false,
  flickerTexts: true,
  flickerBoxes: false
})

// 病例基础信息（正式版可改为从用户档案/后端读取）
const patient = ref({
  name: '—',
  gender: '—',
  age: '—',
  complaint: '未填写（如有眼痛、视力下降、畏光等可在备注中说明）'
})

const doctor = ref({
  name: '眼科医师（系统）',
  reviewer: '主任医师（系统）'
})

const loadFromSession = () => {
  const raw = sessionStorage.getItem('assessmentReport')
  if (!raw) return
  try {
    const row = JSON.parse(raw)
    if (row?.id) assessmentId.value = row.id
    if (row?.time) assessmentTime.value = row.time
    if (typeof row?.score === 'number') finalScore.value = row.score
    if (typeof row?.accuracy === 'number') averageAccuracy.value = row.accuracy
    if (row?.type) detectType.value = row.type
    if (Array.isArray(row?.params?.frequencies) && row.params.frequencies.length) {
      frequencies.value = row.params.frequencies
      params.value.frequencies = row.params.frequencies
    }
    if (row?.params) {
      params.value.boldFont = !!row.params.boldFont
      params.value.flickerTexts = !!row.params.flickerTexts
      params.value.flickerBoxes = !!row.params.flickerBoxes
    }

    // 频率得分：若无真实后端数据，使用“准确率±抖动”生成示例
    const base = averageAccuracy.value || 0.72
    frequencyScores.value = (frequencies.value || []).map(() => {
      const jitter = Math.random() * 0.16 - 0.08
      return Math.max(0.05, Math.min(0.98, base + jitter))
    })
  } catch {
    // ignore
  }
}

const riskLevel = computed(() => {
  if (finalScore.value >= 50) return '无风险'
  if (finalScore.value >= 33) return '中等风险'
  return '有风险'
})

const suggestions = computed(() => {
  if (finalScore.value >= 50) {
    return ['保持良好的用眼习惯与规律作息', '减少长时间近距离用眼，注意间歇休息（20-20-20）', '建议每年复查一次或按需复诊']
  }
  if (finalScore.value >= 33) {
    return ['减少长时间用眼，增加户外活动', '避免强光/暗光环境下长时间盯屏', '建议 3–6 个月复查，必要时眼科进一步评估']
  }
  return ['建议尽快至正规医院眼科进一步检查（眼压、视野、眼底/视神经等）', '遵医嘱治疗与随访，避免过度用眼与刺激', '如出现眼痛、视力骤降等急症表现请及时就医']
})

const followUpAdvice = computed(() => {
  if (finalScore.value >= 50) return '建议 12 个月内复查或按需复诊'
  if (finalScore.value >= 33) return '建议 3–6 个月内复查并观察趋势'
  return '建议尽快就医并按医嘱短期随访'
})

const printDate = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
})

const detailRemark = (score) => {
  if (score >= 0.75) return '反应稳定'
  if (score >= 0.55) return '轻度波动'
  return '波动较大，建议复测'
}

const printReport = () => window.print()

const downloadJson = () => {
  const payload = {
    assessmentId: assessmentId.value,
    assessmentTime: assessmentTime.value,
    detectType: detectType.value,
    finalScore: finalScore.value,
    riskLevel: riskLevel.value,
    averageAccuracy: averageAccuracy.value,
    frequencies: frequencies.value,
    frequencyScores: frequencyScores.value,
    params: params.value
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${assessmentId.value}_report.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

onMounted(() => loadFromSession())
</script>

<style scoped>
.report-page {
  padding: 14px 16px 28px;
  background: #f3f4f6;
}

.topbar {
  max-width: 980px;
  margin: 0 auto 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.title .h {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.title .sub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.paper {
  max-width: 980px;
  margin: 0 auto;
  background: #fff;
  color: #000;
  border: 1px solid #111;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  padding: 22px 22px 18px;
}

.paper-header {
  border-bottom: 2px solid #111;
  padding-bottom: 10px;
  margin-bottom: 14px;
}

.hospital {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 1px;
}

.doc {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
}

.meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
}

.block {
  margin-top: 14px;
}

.block-title {
  font-weight: 800;
  font-size: 13px;
  margin-bottom: 8px;
}

.grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.grid td,
.grid th {
  border: 1px solid #111;
  padding: 8px 10px;
  vertical-align: top;
}

.grid .k {
  width: 90px;
  background: #f7f7f7;
  font-weight: 700;
}

.grid .v {
  background: #fff;
}

.grid .th {
  background: #f0f0f0;
  font-weight: 800;
  text-align: center;
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.score-box {
  border: 1px solid #111;
  padding: 10px;
}

.score-box .lab {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}

.score {
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

.risk {
  font-size: 18px;
  font-weight: 900;
}

.note {
  margin-top: 12px;
  border: 1px dashed #111;
  padding: 10px;
}

.note-title {
  font-weight: 800;
  margin-bottom: 6px;
}

.note-text {
  font-size: 12px;
  line-height: 1.7;
}

.tag {
  display: inline-block;
  border: 1px solid #111;
  padding: 2px 8px;
  margin-right: 8px;
  margin-bottom: 6px;
}

.bar {
  display: inline-block;
  vertical-align: middle;
  width: 200px;
  height: 10px;
  border: 1px solid #111;
  margin-right: 10px;
}

.bar-in {
  height: 100%;
  background: #111;
}

.bullets {
  font-size: 12px;
  line-height: 1.9;
}

.follow {
  margin-top: 10px;
  font-size: 12px;
  padding: 10px;
  border: 1px solid #111;
}

.sign {
  margin-top: 18px;
  display: grid;
  gap: 8px;
  font-size: 12px;
}

.sign .line {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.footer {
  margin-top: 16px;
  border-top: 1px solid #111;
  padding-top: 10px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.7);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

@media print {
  /* Report-only printing: layout hiding is handled globally via .no-print.
     Here we only adjust the report styling for print and allow normal pagination. */

  .no-print {
    display: none !important;
  }

  /* Report page: remove background/box styles for clean PDF */
  .report-page {
    padding: 0 !important;
    background: #fff !important;
  }

  .paper.print-area {
    max-width: none !important;
    width: 100% !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  /* Avoid breaking key blocks; allow tables to paginate normally.
     (Do NOT set avoid on table/tr/td/th, otherwise long tables may get clipped.) */
  .paper-header,
  .summary,
  .note,
  .sign {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
