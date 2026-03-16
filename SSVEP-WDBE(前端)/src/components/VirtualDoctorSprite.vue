<template>
  <div
    class="doctor-sprite"
    :class="{ speaking: speaking, bob: enableBob }"
    :style="{ width: sizePx, height: sizePx }"
    aria-label="虚拟医生"
  >
    <img :src="currentSrc" :alt="alt" draggable="false" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  speaking: { type: Boolean, default: false },
  size: { type: Number, default: 132 },
  enableBob: { type: Boolean, default: true },
  alt: { type: String, default: 'virtual doctor' }
})

const sizePx = computed(() => `${props.size}px`)

const SPRITE_BASE = '/image/doctor_sprite'

const idleSeq = [
  { src: `${SPRITE_BASE}/doctor_idle.png`, duration: 2200 },
  { src: `${SPRITE_BASE}/doctor_blink.png`, duration: 140 },
  { src: `${SPRITE_BASE}/doctor_idle.png`, duration: 2000 }
]

const speakSeq = [

  { src: `${SPRITE_BASE}/doctor_mouth2.png`, duration: 260 },
  { src: `${SPRITE_BASE}/doctor_mouth1.png`, duration: 260 },
  { src: `${SPRITE_BASE}/doctor_mouth2.png`, duration: 260 },
  { src: `${SPRITE_BASE}/doctor_idle.png`, duration: 320 },

  { src: `${SPRITE_BASE}/doctor_mouth2.png`, duration: 260 },
  { src: `${SPRITE_BASE}/doctor_mouth1.png`, duration: 260 },
  { src: `${SPRITE_BASE}/doctor_mouth2.png`, duration: 260 },
  { src: `${SPRITE_BASE}/doctor_idle.png`, duration: 360 },

  { src: `${SPRITE_BASE}/doctor_mouth2.png`, duration: 260 },
  { src: `${SPRITE_BASE}/doctor_mouth1.png`, duration: 260 },
  { src: `${SPRITE_BASE}/doctor_mouth2.png`, duration: 260 },
  { src: `${SPRITE_BASE}/doctor_idle.png`, duration: 400 },


  { src: `${SPRITE_BASE}/doctor_blink.png`, duration: 140 },
  { src: `${SPRITE_BASE}/doctor_idle.png`, duration: 360 }
]

const frameIndex = ref(0)
let timerId = null

const sequence = computed(() => (props.speaking ? speakSeq : idleSeq))

const currentSrc = computed(() => {
  const seq = sequence.value
  const frame = seq[frameIndex.value]
  return frame?.src || `${SPRITE_BASE}/doctor_idle.png`
})

const stop = () => {
  if (timerId) {
    window.clearTimeout(timerId)
    timerId = null
  }
}

const scheduleNext = () => {
  stop()
  const seq = sequence.value
  if (!seq.length) return

  const frame = seq[frameIndex.value] || seq[0]
  const dur = Math.max(60, Number(frame?.duration || 120))

  timerId = window.setTimeout(() => {
    frameIndex.value = (frameIndex.value + 1) % seq.length
    scheduleNext()
  }, dur)
}

const restart = () => {
  frameIndex.value = 0
  scheduleNext()
}

watch(
  () => props.speaking,
  () => {
    restart()
  }
)

onMounted(() => {
  restart()
})

onUnmounted(() => {
  stop()
})
</script>

<style scoped>
.doctor-sprite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translateZ(0);
}

.doctor-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

@keyframes bob {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
  100% {
    transform: translateY(0);
  }
}

.doctor-sprite.bob {
  animation: bob 4.2s ease-in-out infinite;
}
</style>
