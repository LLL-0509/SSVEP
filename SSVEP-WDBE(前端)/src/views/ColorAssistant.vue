<template>
  <div class="page-container">
    <el-row class="content-row" :gutter="16">
      <el-col :xs="24" :md="16" class="col-height">
        <el-card shadow="hover" class="dynamic-card">
          <template #header>
            <div class="card-h"><span>在线问答</span></div>
          </template>
          <div class="chat-wrapper">
            <AssistantChat
              :show-header="false"
              :show-feedback="false"
              :show-stream-toggle="true"
              :assistant-avatar="`${baseUrl}image/doctor_sprite/doctor_idle.png`"
              :user-avatar="`${baseUrl}image/profile.png`"
              assistant-name="视康虚拟医生"
              assistant-title="颜色感知检测助手"
              :welcome-message="qaWelcome"
              :disclaimer="qaDisclaimer"
              :quick-questions="qaQuickQuestions"
              :knowledge-base="qaKnowledgeBase"
              placeholder="请输入您的问题，例如：如何开始检测？"
              height="100%" 
            />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8" class="col-height">
        <el-card shadow="hover" class="dynamic-card">
          <template #header>
            <div class="card-h">使用建议</div>
          </template>
          <div class="tips-layout">
            <div class="tips-scroll-area">
              <div class="tip">
                <div class="t">1. 先完成检测</div>
                <div class="d">建议先在「颜色感知」页面完成一次检测，再回到此处咨询结果解读与复测建议。</div>
              </div>
              <div class="tip">
                <div class="t">2. 描述更具体</div>
                <div class="d">例如：评分、风险等级、准确率、检测时是否眨眼/偏头等，有助于给出更贴近场景的建议。</div>
              </div>
              <div class="tip">
                <div class="t">3. 出现不适及时停止</div>
                <div class="d">如出现头晕、眼痛、恶心或视物模糊等不适，请立即停止检测并休息，必要时就医。</div>
              </div>
            </div>
            <div class="nav-footer">
              <el-divider />
              <div class="quick-nav">
                <el-button type="primary" plain @click="goColor">前往检测</el-button>
                <el-button type="info" plain @click="goHistory">历史记录</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AssistantChat from '@/components/AssistantChat.vue'
const baseUrl = import.meta.env.BASE_URL

const router = useRouter()

const qaWelcome =
  '您好，我是视康虚拟医生。\n这里是「颜色感知检测」问答助手：我可以帮助您了解检测目的、注意事项与结果解读。'

const qaDisclaimer =
  '提示：本助手仅用于健康科普与系统操作指引，不构成医疗诊断。若出现视力下降、眼痛、畏光等症状，请及时就医。'

const qaQuickQuestions = [
  '颜色感知检测主要测什么？',
  '如何开始检测？',
  '检测时需要注意什么？',
  '评分等级怎么理解？',
  '准确率低怎么办？'
]

const qaKnowledgeBase = [
  {
    keywords: ['测什么', '主要测', '颜色感知', '色觉', '色盲', '色弱'],
    answer:
      '颜色感知检测通常用于评估对颜色/对比度等视觉信息的识别能力，可辅助筛查色觉异常或与视功能相关的风险提示。\n建议在光线均匀、屏幕亮度适中情况下进行，避免强反光与过暗环境。'
  },
  {
    keywords: ['如何开始', '怎么开始', '开始检测', '启动'],
    answer:
      '开始检测建议按以下步骤：\n1）确认设备IP与刺激范式等设置；\n2）检查频率与显示内容是否符合要求；\n3）点击「开始检测」后按提示完成刺激/观察；\n4）完成后可在「数据中心」查看记录与报告。'
  },
  {
    keywords: ['注意', '注意事项', '准备', '环境', '姿势', '眨眼'],
    answer:
      '检测注意事项：\n• 保持坐姿稳定，眼睛与屏幕距离适中；\n• 尽量减少头动与频繁眨眼；\n• 环境光稳定、避免屏幕反光；\n• 若有明显不适（头晕/恶心/眼痛），可立即停止并休息。'
  },
  {
    keywords: ['评分', '等级', '无风险', '中等风险', '有风险', '结果'],
    answer:
      '评分等级一般用于辅助判断：\n• 评分 ≥ 50：无风险（绿色）；\n• 33 ≤ 评分 < 50：中等风险（黄色），建议关注与复测；\n• 评分 < 33：有风险（红色），建议进一步检查。\n提示：请结合「准确率、近期趋势、主观症状」综合判断。'
  },
  {
    keywords: ['准确率', '低', '不高', '偏低', '不准', '误差'],
    answer:
      '若准确率偏低，建议：\n1）确认刺激显示是否正常（刷新率、亮度、对比度）；\n2）减少眨眼与头动干扰；\n3）复测1次对比结果；\n4）若多次不稳定，以临床检查为准。'
  },
  {
    keywords: ['异常', '怎么办', '就医', '建议'],
    answer:
      '若多次检测提示中等/高风险，建议到眼科进一步检查（如视力、眼压、视野、眼底/视神经评估等）。出现眼痛、视力骤降、畏光等症状应及时就医。'
  }
]

const goColor = () => router.push('/main/VisualDetection/ColorPerception')
const goHistory = () => router.push('/main/DataCenter?tab=history')
</script>

<style scoped>

.page-container {
  padding: 16px;
  min-height: calc(100vh - 80px); 
  box-sizing: border-box;
  overflow: auto;                 
}

.content-row {
  height: 100%;
}

.col-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 2. 确保卡片完全填满列高度 */
.dynamic-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
}

/* 3. 强制 Card Body 伸展并吸收所有剩余空间 */
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 关键：允许 flex 项目收缩 */
  padding: 12px;
}

/* 4. 问答包装层必须撑满，否则 AssistantChat 会塌陷 */
.chat-wrapper {
  flex: 1;
  height: 100%;
  min-height: 0;
}

.tips-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tips-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.nav-footer {
  margin-top: auto;
}

.tip { margin-bottom: 20px; }
.tip .t { font-weight: 600; margin-bottom: 6px; font-size: 15px; }
.tip .d { font-size: 13px; color: #666; line-height: 1.6; }

.quick-nav {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.card-h { font-weight: bold; font-size: 16px; }
</style>