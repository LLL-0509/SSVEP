<template>
  <!-- 右下角悬浮入口：虚拟医生（正式版固定话术） -->
  <div class="assistant-fab" @click="drawer = true" title="视康虚拟医生">
    <div class="fab-shadow">
      <VirtualDoctorSprite :speaking="speaking" :size="144" />
    </div>
    <div v-if="!drawer" class="fab-tip">点击咨询</div>
  </div>

  <el-drawer v-model="drawer" :with-header="false" size="460px">
    <div class="drawer-header">
      <div class="h-left">
        <div class="h-avatar">
          <VirtualDoctorSprite :speaking="speaking" :size="54" :enable-bob="false" />
        </div>
        <div class="h-meta">
          <div class="h-title">
            视康虚拟医生
            <span class="badge">在线</span>
          </div>
          <div class="h-sub">系统指引 · 检测解读 · 护眼建议</div>
        </div>
      </div>
      <el-button text class="h-close" @click="drawer = false">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>

    <AssistantChat
      :show-header="false"
      :assistant-avatar="'/image/doctor_sprite/doctor_idle.png'"
      :user-avatar="'/image/profile.png'"
      assistant-name="视康虚拟医生"
      assistant-title="眼健康与系统指引"
      :welcome-message="welcome"
      :disclaimer="disclaimer"
      :quick-questions="quickQuestions"
      :knowledge-base="knowledgeBase"
      :show-stream-toggle="true"
      :stream-default="true"
      placeholder="输入您的问题，例如：如何生成报告？"
      height="calc(100vh - 320px)"
      @speaking-change="speaking = $event"
    />
  </el-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import AssistantChat from './AssistantChat.vue'
import VirtualDoctorSprite from './VirtualDoctorSprite.vue'

const drawer = ref(false)
const speaking = ref(false)

watch(
  () => drawer.value,
  (v) => {
    // 关闭抽屉时，强制恢复“闲置”表情，避免卡在说话口型
    if (!v) speaking.value = false
  }
)

const welcome =
  '您好，我是视康虚拟医生。\n我可以为您提供：① 系统操作指引；② 检测流程与结果解读；③ 日常护眼建议。'

const disclaimer =
  '提示：本助手仅用于健康科普与系统使用指引，不构成医疗诊断或治疗建议。若出现眼痛、视力下降、视野缺损、闪光感等症状，请及时就医。'

const quickQuestions = [
  '如何开始一次检测？',
  '评分和风险等级怎么理解？',
  '准确率是什么意思？',
  '在哪里查看历史记录？',
  '如何生成/导出报告？',
  '有什么护眼建议？'
]

const knowledgeBase = [
  {
    keywords: ['开始检测', '如何开始', '怎么检测', '检测流程'],
    answer:
      '检测流程建议如下：\n1）进入左侧菜单「视功能检测」或「眼健康检测」，选择对应项目；\n2）在页面完成参数设置（如频率、文字/刺激范式等）；\n3）点击「开始检测」，按页面提示完成刺激或测试；\n4）完成后到「数据中心」查看本次记录，并可生成报告。'
  },
  {
    keywords: ['评分', '风险', '等级', '无风险', '中等风险', '有风险'],
    answer:
      '评分与风险等级通常用于辅助判断：\n• 评分 ≥ 50：一般提示风险较低（绿色/无风险）；\n• 33 ≤ 评分 < 50：提示需关注（黄色/中等风险）；\n• 评分 < 33：提示风险较高（红色/高风险）。\n建议结合「准确率、近期趋势、主观症状」综合评估。'
  },
  {
    keywords: ['准确率', 'accuracy', '置信', '可信'],
    answer:
      '准确率（Accuracy）用于描述本次算法/分类对数据的匹配程度。\n准确率越高，代表结果越稳定；若准确率偏低，建议：\n1）复测一次；\n2）保证设备连接稳定、环境光适中；\n3）减少头动与眨眼干扰；\n4）如多次偏低，以医生评估为准。'
  },
  {
    keywords: ['历史', '记录', '数据中心', '查看记录', '筛选'],
    answer:
      '历史记录在「数据中心」页：\n• 支持按记录ID/类型筛选；\n• 点击「查看详情」可查看本次参数与建议；\n• 点击「生成报告」可进入报告页进行查看/导出。'
  },
  {
    keywords: ['报告', '生成', '导出', 'pdf'],
    answer:
      '生成报告方式：\n1）进入「数据中心」→「历史检测记录」；\n2）在对应记录行点击「生成报告」；\n3）在报告页可查看指标摘要、风险等级与建议；\n如需对接真实导出/打印模板，可在后续版本拓展。'
  },
  {
    keywords: ['护眼', '眼疲劳', '用眼', '近视', '干涩'],
    answer:
      '日常护眼建议（通用）：\n• 20-20-20：每用眼20分钟，看20英尺外20秒；\n• 保持阅读距离 33–40cm，减少屏幕反光；\n• 增加户外活动与自然光暴露；\n• 规律作息，避免熬夜；\n• 干涩不适可适当休息与眨眼训练，必要时咨询医生。'
  },
  {
    keywords: ['眼痛', '突发', '黑影', '闪光', '视野缺损', '就医'],
    answer:
      '如出现以下情况，建议尽快就医：\n• 突发视力下降、视野缺损；\n• 明显眼痛、畏光、红眼；\n• 闪光感、飞蚊骤增或黑影遮挡；\n• 既往青光眼/视网膜疾病史且症状加重。'
  }
]
</script>

<style scoped>
.assistant-fab {
  position: fixed;
  right: 18px;
  bottom: 16px;
  width: 170px;
  height: 190px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  cursor: pointer;
  z-index: 9999;
}

.fab-shadow {
  filter: drop-shadow(0 12px 26px rgba(17, 36, 95, 0.25));
  transform: translateZ(0);
}

.fab-tip {
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: #2b3a67;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(214, 222, 247, 0.95);
  box-shadow: 0 10px 22px rgba(17, 36, 95, 0.12);
  backdrop-filter: blur(6px);
  user-select: none;
  pointer-events: none;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px;
  border-bottom: 1px solid #ebeef5;
}

.h-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.h-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(242, 245, 255, 0.85);
  border: 1px solid #e6eaf8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.h-meta {
  display: flex;
  flex-direction: column;
}

.h-title {
  font-weight: 900;
  color: #303133;
  letter-spacing: 0.2px;
}

.badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #67c23a;
  background: rgba(103, 194, 58, 0.12);
}

.h-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.h-close {
  margin-left: 10px;
}
</style>
