<script setup>
import CommonAside from '../components/CommonAside.vue'
import CommonHeader from '../components/CommonHeader.vue'
import GuideAssistant from '../components/GuideAssistant.vue'
</script>

<template>
  <div class="common-layout">
    <el-container class="root-container">

      <el-aside width="auto" class="no-print" background-color="#6C63FF">
        <CommonAside />
      </el-aside>

      <el-container class="right-container">
        <el-header class="app-header no-print">
          <CommonHeader />
        </el-header>

        <el-main class="app-main">
          <!-- 让 router-view 有一个“可计算高度”的父容器 -->
          <div class="main-view-scroll">
            <router-view />
          </div>

          <!-- 全局悬浮指引助手 -->
          <div class="no-print">
            <GuideAssistant />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="less" scoped>
/* 关键：把整个布局固定成一屏高度，子页面 height:100% 才有意义 */
.common-layout {
  height: 100vh;
  overflow: hidden;
}

/* Element Plus 容器链路都要能继承高度 */
.root-container,
.right-container {
  height: 100%;
  min-height: 0;
}

.app-header {
  padding: 0;
}

.app-main {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}


.main-view-scroll {
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: auto;          
  -webkit-overflow-scrolling: touch;
}


.el-aside {
  padding: 0px;
}
.el-container.is-vertical {
  margin: 0px;
}
</style>