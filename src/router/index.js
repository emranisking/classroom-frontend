import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, hideChrome: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { public: true, hideChrome: true }
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue')
  },
  {
    path: '/classes/:id',
    name: 'class-detail',
    component: () => import('@/views/ClassDetailView.vue'),
    props: true
  },
  {
    path: '/assignments/:id',
    name: 'assignment-detail',
    component: () => import('@/views/AssignmentDetailView.vue'),
    props: true
  },
  {
    path: '/submissions/:id',
    name: 'submission-detail',
    component: () => import('@/views/SubmissionDetailView.vue'),
    props: true
  },
  {
    path: '/enrollments',
    name: 'enrollments',
    component: () => import('@/views/EnrollmentsView.vue'),
    meta: { roles: ['Student'] }
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('@/views/ResultsView.vue'),
    meta: { roles: ['Student'] }
  },
  {
    path: '/teacher-applications',
    name: 'teacher-applications',
    component: () => import('@/views/TeacherApplicationsView.vue'),
    meta: { roles: ['Teacher', 'Admin'] }
  },
  {
    path: '/resubmissions',
    name: 'resubmissions',
    component: () => import('@/views/ResubmissionsView.vue'),
    meta: { roles: ['Teacher', 'Admin'] }
  },
  {
    path: '/admin/courses',
    name: 'admin-courses',
    component: () => import('@/views/CoursesAdminView.vue'),
    meta: { roles: ['Admin'] }
  },
  {
    path: '/admin/classes',
    name: 'admin-classes',
    component: () => import('@/views/ClassesAdminView.vue'),
    meta: { roles: ['Admin'] }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/UsersAdminView.vue'),
    meta: { roles: ['Admin'] }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.public && auth.isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    return { name: 'dashboard' }
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
