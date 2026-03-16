<template>
  <div class="page">
    <div class="header">
      <div>
        <h2>{{ title }}</h2>
        <div class="sub">{{ subTitle }}</div>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- Left: device + paradigm -->
      <el-col :xs="24" :md="6">
        <el-card shadow="hover" class="left-card">
          <div class="left-title">设备IP地址：</div>
          <el-input v-model="deviceIP" placeholder="请输入设备IP地址" size="large" />

          <div class="left-title" style="margin-top: 16px">刺激范式：</div>
          <el-select v-model="selected" size="large" style="width: 100%">
            <el-option label="文本闪烁刺激范式" value="text" />
            <el-option label="光栅刺激范式" value="grating" />
            <el-option label="棋盘格刺激范式" value="checkerboard" />
            <el-option label="同心环扩张运动刺激范式" value="concentric" />
          </el-select>

          <el-divider />

          <div class="mini">
            <div class="mini-title">预览</div>
            <div class="preview">
              <canvas ref="previewCanvas" class="preview-canvas"></canvas>
            </div>
            <div class="mini-desc">点击「开始检测」将进入全屏刺激界面；点击屏幕任意位置退出。</div>
          </div>
        </el-card>
      </el-col>

      <!-- Right: table config -->
      <el-col :xs="24" :md="18">
        <el-card shadow="hover" class="right-card">
          <div class="table-head">
            <div class="th">范式名</div>
            <div class="th">频率 (Hz)</div>
            <div class="th">间距 (px) / 文本</div>
          </div>

          <!-- text row -->
          <div class="row" :class="{ active: selected === 'text' }">
            <div class="c1">文本闪烁刺激范式</div>
            <div class="c2">
              <el-input-number v-model="cfg.text.freq" :min="0.5" :max="30" :step="0.25" />
            </div>
            <div class="c3 textcells">
              <el-input v-model="cfg.text.a" style="width: 120px" />
              <el-input v-model="cfg.text.b" style="width: 120px" />
              <el-input v-model="cfg.text.c" style="width: 120px" />
            </div>
          </div>

          <!-- grating row -->
          <div class="row" :class="{ active: selected === 'grating' }">
            <div class="c1">光栅刺激范式</div>
            <div class="c2">
              <el-input-number v-model="cfg.grating.freq" :min="0.5" :max="30" :step="0.25" />
            </div>
            <div class="c3">
              <el-input-number v-model="cfg.grating.stripe" :min="20" :max="600" :step="10" />
              <span class="unit">条纹宽度</span>
            </div>
          </div>

          <!-- checkerboard row -->
          <div class="row" :class="{ active: selected === 'checkerboard' }">
            <div class="c1">棋盘格刺激范式</div>
            <div class="c2">
              <el-input-number v-model="cfg.checker.freq" :min="0.5" :max="30" :step="0.25" />
            </div>
            <div class="c3">
              <el-input-number v-model="cfg.checker.size" :min="20" :max="400" :step="10" />
              <span class="unit">方格大小</span>
            </div>
          </div>

          <!-- concentric row -->
          <div class="row" :class="{ active: selected === 'concentric' }">
            <div class="c1">同心环扩张运动刺激范式</div>
            <div class="c2">
              <el-input-number v-model="cfg.concentric.freq" :min="0.5" :max="30" :step="0.25" />
            </div>
            <div class="c3">
              <el-input-number v-model="cfg.concentric.spacing" :min="40" :max="500" :step="10" />
              <span class="unit">环间距</span>
            </div>
          </div>

          <div class="actions">
            <el-button type="success" size="large" @click="start">开始检测</el-button>
            <el-button type="warning" size="large" @click="evaluate">评估</el-button>
          </div>
        </el-card>

        <el-card shadow="hover" class="legend-card">
          <div class="legend-title">评分等级说明</div>
          <div class="legend">
            <div class="item">
              <div class="lab green">无风险（绿色）：</div>
              <div class="desc">评分 ≥ 50，表示用户的视功能正常。</div>
            </div>
            <div class="item">
              <div class="lab yellow">中等风险（黄色）：</div>
              <div class="desc">33 ≤ 评分 &lt; 50，表示用户的视功能可能存在轻微问题。</div>
            </div>
            <div class="item">
              <div class="lab red">有风险（红色）：</div>
              <div class="desc">评分 &lt; 33，表示用户视功能存在明显问题。</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Fullscreen Stimulus -->
    <el-dialog v-model="running" width="100%" top="0" :show-close="false" class="fs-dialog">
      <div class="fs" @click="stop">
        <canvas ref="fsCanvas" class="fs-canvas"></canvas>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const { title, subTitle, defaultIP, defaultParadigm } = defineProps({
  title: { type: String, default: '视力检测' },
  subTitle: { type: String, default: '多范式闪烁刺激 · 文本/光栅/棋盘格/同心环' },
  defaultIP: { type: String, default: '127.0.0.1' },
  defaultParadigm: { type: String, default: 'text' }
})

const deviceIP = ref(defaultIP)
const selected = ref(defaultParadigm)

const cfg = reactive({
  text: { freq: 10, a: 'A', b: 'B', c: 'C' },
  grating: { freq: 5, stripe: 200 },
  checker: { freq: 5, size: 200 },
  concentric: { freq: 10, spacing: 200 }
})

const previewCanvas = ref(null)
const fsCanvas = ref(null)
const running = ref(false)

let raf = 0
let startAt = 0

const resizeCanvas = (canvas) => {
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.floor(rect.width * dpr))
  canvas.height = Math.max(1, Math.floor(rect.height * dpr))
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

const freqOf = () => {
  if (selected.value === 'text') return cfg.text.freq
  if (selected.value === 'grating') return cfg.grating.freq
  if (selected.value === 'checkerboard') return cfg.checker.freq
  return cfg.concentric.freq
}

const drawGrating = (ctx, w, h, phase) => {
  const stripe = Math.max(10, Number(cfg.grating.stripe || 200))
  for (let x = 0; x < w; x += stripe) {
    const isBlack = ((Math.floor(x / stripe) + phase) % 2) === 0
    ctx.fillStyle = isBlack ? '#000' : '#fff'
    ctx.fillRect(x, 0, stripe, h)
  }
}

const drawChecker = (ctx, w, h, phase) => {
  const size = Math.max(10, Number(cfg.checker.size || 200))
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      const isBlack = ((Math.floor(x / size) + Math.floor(y / size) + phase) % 2) === 0
      ctx.fillStyle = isBlack ? '#000' : '#fff'
      ctx.fillRect(x, y, size, size)
    }
  }
}

const drawConcentric = (ctx, w, h, phase, t) => {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  const maxR = Math.hypot(cx, cy)
  const spacing = Math.max(20, Number(cfg.concentric.spacing || 200))
  const drift = ((t * 0.0004) % 1) * spacing

  for (let r = 0; r < maxR; r += spacing / 3) {
    const v = (Math.sin(((r + drift) / spacing) * Math.PI * 2) + 1) / 2
    const g = phase === 0 ? v : 1 - v
    const gray = Math.round(20 + g * 200)
    ctx.strokeStyle = `rgb(${gray},${gray},${gray})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  const dot = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50)
  dot.addColorStop(0, phase === 0 ? '#fff' : '#111')
  dot.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = dot
  ctx.beginPath()
  ctx.arc(cx, cy, 50, 0, Math.PI * 2)
  ctx.fill()
}

const drawText = (ctx, w, h, phase) => {
  ctx.fillStyle = '#d9d9d9'
  ctx.fillRect(0, 0, w, h)
  const show = phase === 0
  if (!show) return

  const letters = [cfg.text.a, cfg.text.b, cfg.text.c].map((s) => (s || '').toString().slice(0, 2))
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const base = Math.min(w, h)
  ctx.font = `900 ${Math.floor(base * 0.42)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`
  const y = h / 2
  ctx.fillText(letters[0] || 'A', w * 0.18, y)
  ctx.fillText(letters[1] || 'B', w * 0.50, y)
  ctx.fillText(letters[2] || 'C', w * 0.82, y)
}

const render = (canvas, t) => {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  const freq = Math.max(0.5, Number(freqOf() || 10))
  const phase = Math.floor((t - startAt) / (1000 / (freq * 2))) % 2

  if (selected.value === 'grating') drawGrating(ctx, w, h, phase)
  else if (selected.value === 'checkerboard') drawChecker(ctx, w, h, phase)
  else if (selected.value === 'concentric') drawConcentric(ctx, w, h, phase, t)
  else drawText(ctx, w, h, phase)
}

const loop = (t) => {
  render(fsCanvas.value, t)
  raf = requestAnimationFrame(loop)
}

const start = () => {
  if (!deviceIP.value?.trim()) {
    ElMessage.warning('请先填写设备IP地址')
    return
  }
  running.value = true
  startAt = performance.now()
  requestAnimationFrame(() => {
    resizeCanvas(fsCanvas.value)
    raf = requestAnimationFrame(loop)
  })
}

const stop = () => {
  running.value = false
}

const evaluate = () => {
  ElMessage.success('评估已提交（演示）。可在「数据中心」查看记录与病例式报告。')
}

watch(running, (v) => {
  if (!v) {
    cancelAnimationFrame(raf)
    raf = 0
  }
})

const drawPreview = () => {
  if (!previewCanvas.value) return
  resizeCanvas(previewCanvas.value)
  const t = performance.now()
  startAt = t
  render(previewCanvas.value, t)
}

const handleResize = () => {
  if (running.value) resizeCanvas(fsCanvas.value)
  drawPreview()
}

watch(
  () => [
    selected.value,
    cfg.text.freq,
    cfg.text.a,
    cfg.text.b,
    cfg.text.c,
    cfg.grating.freq,
    cfg.grating.stripe,
    cfg.checker.freq,
    cfg.checker.size,
    cfg.concentric.freq,
    cfg.concentric.spacing
  ],
  () => drawPreview(),
  { deep: true }
)

onMounted(() => {
  drawPreview()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(raf)
})
</script>

<style scoped>

.page {
  padding: 24px 24px 28px;
  height: 100%;
  overflow: auto;
  background: #f5f7fa;
}



.header {
  display: flex;
  justify-content: center;  
  align-items: center;
  margin-bottom: 14px;
  text-align: center;
}

.sub {
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  margin-top: 8px;
}

.left-card,
.right-card,
.legend-card {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: none;
}

:deep(.left-card .el-card__body),
:deep(.right-card .el-card__body),
:deep(.legend-card .el-card__body) {
  padding: 22px 22px;
}

.left-title {
  font-weight: 800;
  margin-bottom: 12px;
}


.mini {
  display: grid;
  gap: 10px;
}

.mini-title {
  font-weight: 900;
}

.preview {
  height: 220px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.10);
  background: #fff;
}

.preview-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.mini-desc {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.7;
}


.table-head {
  display: grid;
  grid-template-columns: 260px 180px 1fr;
  gap: 12px;
  padding: 14px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  font-weight: 900;
}


.row {
  display: grid;
  grid-template-columns: 260px 180px 1fr;
  gap: 12px;
  padding: 18px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  align-items: center;
}

.row.active {
  background: rgba(64, 158, 255, 0.06);
  border-radius: 8px;
}

.c1 {
  font-weight: 800;
}

.textcells {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.unit {
  margin-left: 10px;
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
}


.actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  padding: 26px 0 10px;
}


.legend-card {
  margin-top: 18px;
  background: #f5f7fa; 
}

.legend-title {
  font-weight: 900;
  text-align: center;
  font-size: 18px;
  padding: 8px 0 18px;
}

.legend {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.item {
  text-align: center;
}

.lab {
  font-weight: 900;
  margin-bottom: 10px;
  font-size: 15px;
}

.desc {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.8;
}

.green {
  color: #00a870;
}

.yellow {
  color: #d48806;
}

.red {
  color: #d32029;
}

/* Fullscreen dialog */
:deep(.fs-dialog) {
  margin: 0;
}

:deep(.fs-dialog .el-dialog) {
  margin: 0;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
}

:deep(.fs-dialog .el-dialog__header) {
  display: none;
}

:deep(.fs-dialog .el-dialog__body) {
  padding: 0;
}

.fs {
  width: 100vw;
  height: 100vh;
  background: #000;
}

.fs-canvas {
  width: 100%;
  height: 100%;
  display: block;
}


@media (max-width: 960px) {
  .table-head,
  .row {
    grid-template-columns: 1fr;
  }
  .row {
    gap: 10px;
  }
}
</style>