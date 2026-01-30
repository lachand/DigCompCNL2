import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue')
    },
    // New hierarchical Learning Outcomes routes
    {
      path: '/outcomes',
      name: 'outcomes',
      component: () => import('@/views/LearningOutcomesView.vue')
    },
    {
      path: '/outcomes/:domain',
      name: 'outcomes-domain',
      component: () => import('@/views/LearningOutcomesView.vue')
    },
    {
      path: '/outcomes/:domain/:competence',
      name: 'outcomes-competence',
      component: () => import('@/views/LearningOutcomesView.vue')
    },
    // Legacy routes (redirect to new structure)
    {
      path: '/l1',
      redirect: '/outcomes'
    },
    {
      path: '/l2',
      redirect: '/outcomes'
    },
    {
      path: '/l3',
      redirect: '/outcomes'
    },
    {
      path: '/competences/:year',
      redirect: '/outcomes'
    },
    // Other views
    {
      path: '/kanban',
      name: 'kanban',
      component: () => import('@/views/KanbanView.vue')
    },
    {
      path: '/overview',
      name: 'overview',
      component: () => import('@/views/OverviewView.vue')
    },
    {
      path: '/comparison',
      name: 'comparison',
      component: () => import('@/views/ComparisonView.vue')
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('@/views/StatisticsView.vue')
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue')
    },
    {
      path: '/gamification',
      name: 'gamification',
      component: () => import('@/views/GamificationView.vue')
    }
  ]
})

export default router
