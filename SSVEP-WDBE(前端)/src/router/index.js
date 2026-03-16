import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import MainView from '@/views/MainView.vue'
import HomeView from '@/views/HomeView.vue'
import HistoryCenter from '@/views/HistoryCenter.vue'
import EyeHealth from '@/views/EyeHealth.vue'
import SettingView from '@/views/SettingView.vue'
import VisualDetection from '@/views/VisualDetection.vue'
import ColorPerception from '@/views/ColorPerception.vue'
import ColorAssistant from '@/views/ColorAssistant.vue'
import VisualAcuityTesting from '@/views/VisualAcuityTesting.vue'
import SensitivityTesting from '@/views/SensitivityTesting.vue'
import GlaucomaTest from '@/views/GlaucomaTest.vue'
import CataractDetection from '@/views/CataractDetection.vue'
import MacularTest from '@/views/MacularTest.vue'
import DetectView from '@/views/DetectView.vue'
import AssessmentReport from '@/views/AssessmentReport.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Login',
      component: LoginView
    },
    {
      path: '/main',
      name: 'Main',
      component: MainView,
      // meta: { requiresAuth: true }, 
      children:[
        {
          path: '',
          redirect: 'HomeView'
        },
        {
          path: 'HomeView',
          name: 'Home',
          component: HomeView,
          // meta: { requiresAuth: true }
        },
        {
          path: 'DataCenter',
          name: 'DataCenter',
          component: HistoryCenter
        },
        {
          path: 'EyeHealth',
          name: 'EyeHealth',
          component: EyeHealth,
          // meta: { requiresAuth: true },
          children: [
            {
              path: 'GlaucomaTest',
              name: 'GlaucomaTest',
              component: GlaucomaTest,
              // meta: { requiresAuth: true }
            },
            {
              path:'AssessmentReport',
              name:'AssessmentReport',
              component:AssessmentReport,
              // meta: { requiresAuth: true }
            },
            {
              path: 'CataractDetection',
              name: 'CataractDetection',
              component: CataractDetection,
              // meta: { requiresAuth: true }
            },
            {
              path: 'MacularTest',
              name: 'MacularTest',
              component: MacularTest,
              // meta: { requiresAuth: true }
            },
          ]
        },
        {
          path: 'SettingView',
          name: 'SettingView',
          component: SettingView,
          // meta: { requiresAuth: true }
        },
        {
          path: 'VisualDetection',
          name: 'VisualDetection',
          component: VisualDetection,
          // meta: { requiresAuth: true },
          children: [
            {
              path: 'ColorPerception',
              name: 'ColorPerception',
              component: ColorPerception,
              // meta: { requiresAuth: true }
            },
            {
              path: 'ColorAssistant',
              name: 'ColorAssistant',
              component: ColorAssistant,
            },
            {
              path: 'VisualAcuityTesting',
              name: 'VisualAcuityTesting',
              component: VisualAcuityTesting,
              // meta: { requiresAuth: true }
            },
            {
              path: 'SensitivityTesting',
              name: 'SensitivityTesting',
              component: SensitivityTesting,
              // meta: { requiresAuth: true }
            },
          ]
        },
        {
          path: 'DetectView',
          name: 'DetectView',
          component: DetectView,
          // meta: { requiresAuth: true }
        },
      ]
    },
  ],
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('authToken')

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' }) // 未登录则跳转到登录页面
  } else {
    next() // 已登录则正常访问目标页面
  }
})

export default router
