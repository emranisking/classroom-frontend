<script setup>
import { useAuthStore } from '@/stores/auth'
defineProps({ open: { type: Boolean, default: true } })
const auth = useAuthStore()
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: !open }">
    <nav class="nav-group">
      <router-link to="/" class="nav-item" exact-active-class="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V10.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
        <span class="nav-label">Classes</span>
      </router-link>

      <router-link v-if="auth.isStudent" to="/enrollments" class="nav-item" active-class="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3 3 7l9 4 9-4-9-4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 10v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" stroke="currentColor" stroke-width="1.8"/></svg>
        <span class="nav-label">Enrollments</span>
      </router-link>

      <router-link v-if="auth.isStudent" to="/results" class="nav-item" active-class="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 17V9M13 17V5M18 17v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 21h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span class="nav-label">Results</span>
      </router-link>

      <router-link v-if="auth.isTeacher || auth.isAdmin" to="/teacher-applications" class="nav-item" active-class="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M9 8h1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>
        <span class="nav-label">Teacher applications</span>
      </router-link>

      <router-link v-if="auth.isTeacher || auth.isAdmin" to="/resubmissions" class="nav-item" active-class="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4v6h6M20 20v-6h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 14a8 8 0 0 0 14.9 2.3M19 10A8 8 0 0 0 4.1 7.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span class="nav-label">Resubmissions</span>
      </router-link>
    </nav>

    <template v-if="auth.isAdmin">
      <div class="nav-divider"></div>
      <div class="nav-section-title" v-if="open">Admin</div>
      <nav class="nav-group">
        <router-link to="/admin/courses" class="nav-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19.5V5a2 2 0 0 1 2-2h11.5a1 1 0 0 1 1 1v13.5" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 21a2 2 0 0 1 0-4H18" stroke="currentColor" stroke-width="1.8"/></svg>
          <span class="nav-label">Courses</span>
        </router-link>
        <router-link to="/admin/classes" class="nav-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 9h18M8 4v-1M16 4v-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          <span class="nav-label">Classes admin</span>
        </router-link>
        <router-link to="/admin/users" class="nav-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 20c1-3.3 3.3-5 5.5-5s4.5 1.7 5.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M15.5 6.5A3.2 3.2 0 0 1 17 12.4M17.5 15c1.8.4 3.3 1.9 4 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          <span class="nav-label">Users</span>
        </router-link>
      </nav>
    </template>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: var(--topbar-h);
  bottom: 0;
  left: 0;
  width: var(--sidebar-w);
  background: var(--gc-surface);
  border-right: 1px solid var(--gc-border);
  padding: 8px;
  overflow-y: auto;
  transition: width .2s ease;
  z-index: 90;
}
.sidebar.collapsed { width: 72px; }
.sidebar.collapsed .nav-label,
.sidebar.collapsed .nav-section-title { display: none; }
.sidebar.collapsed .nav-item { justify-content: center; }

.nav-group { display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 20px;
  padding: 10px 20px;
  border-radius: 0 20px 20px 0;
  color: var(--gc-text-secondary);
  font-size: 14px;
  white-space: nowrap;
}
.sidebar.collapsed .nav-item { border-radius: 50%; width: 48px; height: 48px; padding: 0; margin: 0 auto; }
.nav-item:hover { background: var(--gc-hover); }
.nav-item.active { background: #e8f0fe; color: var(--gc-blue-dark); font-weight: 500; }
.nav-item.active svg path, .nav-item.active svg rect, .nav-item.active svg circle { stroke: var(--gc-blue-dark); }

.nav-divider { height: 1px; background: var(--gc-border); margin: 12px 8px; }
.nav-section-title {
  font-size: 12px; font-weight: 600; text-transform: uppercase;
  color: var(--gc-text-tertiary); padding: 4px 20px 8px; letter-spacing: .04em;
}

@media (max-width: 900px) {
  .sidebar { display: none; }
}
</style>
