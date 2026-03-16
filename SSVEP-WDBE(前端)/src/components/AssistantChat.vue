<template>
  <div class="assistant-chat">
    <div v-if="showHeader" class="header">
      <div class="avatar-wrap">
        <img :src="assistantAvatar" class="avatar" alt="assistant" />
      </div>
      <div class="meta">
        <div class="name">{{ assistantName }}</div>
        <div class="title">{{ assistantTitle }}</div>
      </div>
      <div class="right">
        <el-tooltip content="清空对话" placement="top">
          <el-button text @click="clear" :disabled="isSending">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <el-alert
      v-if="disclaimer"
      class="disclaimer"
      type="info"
      :closable="false"
      :title="disclaimer"
      show-icon
    />

    <div class="quick" v-if="quickQuestions.length">
      <div class="quick-label">快捷提问：</div>
      <el-space wrap :size="8">
        <el-tag
          v-for="(q, idx) in quickQuestions"
          :key="idx"
          effect="plain"
          class="quick-tag"
          @click="sendQuick(q)"
        >
          {{ q }}
        </el-tag>
      </el-space>
    </div>

    <div ref="scrollContainer" class="chat-window" :style="{ height: chatWindowHeight }">
      <div v-for="(msg, i) in messages" :key="i" class="chat-message">
        <!-- Assistant -->
        <template v-if="msg.role === 'assistant'">
          <div class="message-left">
            <img :src="assistantAvatar" class="avatar small" alt="assistant" />
            <div class="chat-bubble ai">
              <div v-if="stream && msg.streaming" class="streaming-content">
                {{ msg.content }}<span class="typing-cursor">|</span>
              </div>

              <div v-else class="complete-content">
                {{ msg.content }}
              </div>

              <div v-if="msg.loading" class="thinking">
                <el-icon class="spin"><Loading /></el-icon>
                <span>正在整理要点…</span>
              </div>
            </div>
          </div>

          <div v-if="showFeedback && !msg.loading && !msg.streaming" class="feedback">
            <span class="feedback-text">本条是否有帮助？</span>
            <el-space :size="6">
              <el-button
                size="small"
                :type="msg.feedback === 'like' ? 'primary' : 'default'"
                plain
                @click="handleFeedback(i, 'like')"
              >
                <el-icon><Select /></el-icon>
                有用
                <span class="count">{{ msg.likeCount || 0 }}</span>
              </el-button>
              <el-button
                size="small"
                :type="msg.feedback === 'dislike' ? 'danger' : 'default'"
                plain
                @click="handleFeedback(i, 'dislike')"
              >
                <el-icon><CloseBold /></el-icon>
                需改进
                <span class="count">{{ msg.dislikeCount || 0 }}</span>
              </el-button>
            </el-space>
          </div>
        </template>

        <!-- User -->
        <template v-else>
          <div class="message-right">
            <div class="chat-bubble user">{{ msg.content }}</div>
            <img :src="userAvatar" class="avatar small" alt="user" />
          </div>
        </template>
      </div>
    </div>

    <div class="toolbar" v-if="showStreamToggle">
      <el-checkbox v-model="stream" :disabled="isSending">流式输出</el-checkbox>
      <div class="toolbar-spacer"></div>
      <el-button size="small" @click="copyLast" :disabled="!lastAssistantText">复制回答</el-button>
    </div>

    <div class="input-area">
      <el-input
        v-model="input"
        :placeholder="placeholder"
        clearable
        :disabled="disabled || isSending"
        @keyup.enter="send"
      />
      <el-button
        type="primary"
        @click="send"
        :disabled="disabled || isSending || !input.trim()"
        :loading="isSending"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const emit = defineEmits(['speaking-change'])

const props = defineProps({
  assistantName: { type: String, default: '视康虚拟医生' },
  assistantTitle: { type: String, default: '眼健康与系统指引' },
  assistantAvatar: { type: String, default: `${import.meta.env.BASE_URL}image/doctor_sprite/doctor_idle.png` },
  userAvatar: { type: String, default: `${import.meta.env.BASE_URL}image/profile.png` },
  placeholder: { type: String, default: '请输入您的问题…' },
  welcomeMessage: {
    type: String,
    default: '您好，我是视康虚拟医生。我可以为您提供检测流程指引与结果解读。'
  },
  disclaimer: {
    type: String,
    default:
      '提示：本助手提供健康科普与系统使用指引，不构成医疗诊断；如出现视物模糊、眼痛、视野缺损等症状，请及时就医。'
  },
  quickQuestions: { type: Array, default: () => [] },
  knowledgeBase: { type: Array, default: () => [] },
  fallbackAnswer: {
    type: String,
    default:
      '我已收到。当前版本可能无法覆盖所有问题。建议您：① 查看“评分等级说明”；② 对照检测记录与准确率；③ 如有不适，及时就医。'
  },
  showHeader: { type: Boolean, default: true },
  showFeedback: { type: Boolean, default: true },
  showStreamToggle: { type: Boolean, default: true },
  streamDefault: { type: Boolean, default: true },
  height: { type: String, default: '320px' },
  disabled: { type: Boolean, default: false }
})

const input = ref('')
const messages = ref([])
const stream = ref(props.streamDefault)
const scrollContainer = ref(null)
const isSending = ref(false)

let streamTimer = null

watch(
  () => props.streamDefault,
  (v) => {
    stream.value = !!v
  }
)

const chatWindowHeight = computed(() => props.height)

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}

const normalize = (s) => (s || '').toString().trim()

const findAnswer = (question) => {
  const q = normalize(question)
  if (!q) return props.fallbackAnswer

  // 优先命中：关键词数组任意匹配
  for (const item of props.knowledgeBase) {
    if (!item) continue
    const keys = Array.isArray(item.keywords) ? item.keywords : []
    const hit = keys.some((k) => k && q.includes(k))
    if (!hit) continue

    const a = item.answer
    if (typeof a === 'function') return a(q)
    if (typeof a === 'string') return a
  }

  return props.fallbackAnswer
}

const pushAssistant = (text) => {
  const msg = {
    role: 'assistant',
    content: '',
    loading: false,
    streaming: !!stream.value,
    feedback: null,
    likeCount: 0,
    dislikeCount: 0
  }
  messages.value.push(msg)
  scrollToBottom()

  if (stream.value) {
    let idx = 0
    const full = text
    streamTimer = window.setInterval(() => {
      if (idx < full.length) {
        msg.content += full[idx]
        idx += 1
        messages.value = [...messages.value]
        scrollToBottom()
      } else {
        window.clearInterval(streamTimer)
        streamTimer = null
        msg.streaming = false
        messages.value = [...messages.value]
        isSending.value = false
        emit('speaking-change', false)
      }
    }, 18)
  } else {
    msg.loading = true
    messages.value = [...messages.value]
    window.setTimeout(() => {
      msg.content = text
      msg.loading = false
      messages.value = [...messages.value]
      isSending.value = false
      emit('speaking-change', false)
      scrollToBottom()
    }, 650)
  }
}

const send = () => {
  if (props.disabled || isSending.value) return

  const q = normalize(input.value)
  if (!q) return

  isSending.value = true
  emit('speaking-change', true)
  messages.value.push({ role: 'user', content: q })
  input.value = ''
  scrollToBottom()

  const answer = findAnswer(q)
  pushAssistant(answer)
}

const sendQuick = (q) => {
  if (props.disabled || isSending.value) return
  input.value = q
  send()
}

const clear = () => {
  if (isSending.value) return
  emit('speaking-change', false)
  messages.value = [
    {
      role: 'assistant',
      content: props.welcomeMessage,
      loading: false,
      streaming: false,
      feedback: null,
      likeCount: 0,
      dislikeCount: 0
    }
  ]
  scrollToBottom()
}

const handleFeedback = (index, type) => {
  const msg = messages.value[index]
  if (!msg || msg.role !== 'assistant') return

  if (msg.feedback === type) {
    msg.feedback = null
    if (type === 'like') msg.likeCount = Math.max(0, (msg.likeCount || 0) - 1)
    else msg.dislikeCount = Math.max(0, (msg.dislikeCount || 0) - 1)
  } else {
    // 切换反馈
    if (msg.feedback === 'like') msg.likeCount = Math.max(0, (msg.likeCount || 0) - 1)
    if (msg.feedback === 'dislike') msg.dislikeCount = Math.max(0, (msg.dislikeCount || 0) - 1)

    msg.feedback = type
    if (type === 'like') msg.likeCount = (msg.likeCount || 0) + 1
    else msg.dislikeCount = (msg.dislikeCount || 0) + 1
  }

  messages.value = [...messages.value]
}

const lastAssistantText = computed(() => {
  const last = [...messages.value].reverse().find((m) => m.role === 'assistant')
  return last?.content || ''
})

const copyLast = async () => {
  const text = lastAssistantText.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch (e) {
    // 兼容：部分浏览器不允许 clipboard
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      // ignore
    }
    document.body.removeChild(ta)
  }
}

onMounted(() => {
  clear()
})

onUnmounted(() => {
  if (streamTimer) {
    window.clearInterval(streamTimer)
    streamTimer = null
  }
  emit('speaking-change', false)
})
</script>

<style scoped>
.assistant-chat {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-wrap {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  overflow: hidden;
  background: #f2f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e6eaf8;
}

.avatar {
  width: 46px;
  height: 46px;
  object-fit: cover;
}

.avatar.small {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #f2f5ff;
  border: 1px solid #e6eaf8;
}

.meta {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 800;
  color: #303133;
  letter-spacing: 0.3px;
}

.title {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}

.right {
  margin-left: auto;
}

.disclaimer {
  margin: 2px 0 0;
}

.quick {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-label {
  font-size: 12px;
  color: #606266;
}

.quick-tag {
  cursor: pointer;
  user-select: none;
}

.chat-window {
  overflow-y: auto;
  padding: 10px;
  background: #f7f9ff;
  border-radius: 12px;
  border: 1px solid #e6eaf8;
}

.chat-message {
  margin-bottom: 12px;
}

.message-left {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.message-right {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
}

.chat-bubble {
  max-width: 72%;
  padding: 10px 12px;
  border-radius: 14px;
  word-break: break-word;
  line-height: 1.6;
  box-shadow: 0 6px 18px rgba(17, 36, 95, 0.08);
}

.chat-bubble.ai {
  background: #ffffff;
  color: #303133;
  border-top-left-radius: 8px;
}

.chat-bubble.user {
  background: #6c63ff;
  color: #fff;
  border-top-right-radius: 8px;
}

.streaming-content {
  white-space: pre-wrap;
}

.complete-content {
  white-space: pre-wrap;
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  margin-left: 2px;
  font-weight: 700;
  color: #6c63ff;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.thinking {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 12px;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.feedback {
  margin: 6px 0 10px 44px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.feedback-text {
  font-size: 12px;
  color: #909399;
}

.count {
  margin-left: 4px;
  font-weight: 700;
  opacity: 0.8;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-spacer {
  flex: 1;
}

.input-area {
  display: flex;
  gap: 10px;
}
</style>
