<script setup>
import { computed } from 'vue'

const props = defineProps({
  klass: { type: Object, required: true }
})

const banners = ['var(--banner-1)','var(--banner-2)','var(--banner-3)','var(--banner-4)','var(--banner-5)','var(--banner-6)','var(--banner-7)','var(--banner-8)']

const banner = computed(() => {
  const seed = (props.klass.id || 0) + (props.klass.courseId || 0)
  return banners[seed % banners.length]
})

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}
</script>

<template>
  <router-link :to="`/classes/${klass.id}`" class="class-card">
  {{ console.log('Class data:', klass) }}
    <div class="card-banner" :style="{ background: banner }">
      <div class="banner-pattern"></div>
      <div class="banner-text">
        <h3>{{ klass.courseCode || klass.courseName || 'Class' }}</h3>
        <p>{{ klass.name }}</p>
      </div>
      <span class="banner-avatar">{{ initials(klass.teacherName || klass.courseCode) }}</span>
    </div>
    <div class="card-body">
      <div class="card-teacher">  {{ klass.teacher?.name || klass.teacherName || klass.instructor || klass.teacherName || 'Unassigned teacher' }}</div>
      <div class="card-meta">
        <span>{{ klass.dayOfWeek }}</span>
        <span v-if="klass.startTime">· {{ klass.startTime }}–{{ klass.endTime }}</span>
      </div>
    </div>
    <div class="card-footer">
      <span class="chip" :class="`chip-${(klass.status || '').toLowerCase()}`">{{ klass.status }}</span>
      <span class="card-capacity">{{ klass.enrolledCount ?? 0 }}/{{ klass.capacity }} seats</span>
    </div>
  </router-link>
</template>

<style scoped>
.class-card {
  display: block;
  background: var(--gc-surface);
  border: 1px solid var(--gc-border);
  border-radius: var(--gc-radius);
  overflow: hidden;
  color: var(--gc-text);
  transition: box-shadow .15s ease, transform .1s ease;
}
.class-card:hover {
  box-shadow: var(--gc-shadow-lg);
}
.card-banner {
  position: relative;
  height: 100px;
  padding: 16px;
  color: #fff;
  overflow: hidden;
}
.banner-pattern {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle at 90% 10%, rgba(255,255,255,.14) 0, transparent 40%),
    radial-gradient(circle at 10% 100%, rgba(255,255,255,.1) 0, transparent 45%);
}
.banner-text { position: relative; z-index: 1; }
.banner-text h3 {
  margin: 0 0 4px;
  font-family: 'Google Sans', Roboto, sans-serif;
  font-size: 18px;
  font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.banner-text p { margin: 0; font-size: 13px; opacity: .92; }
.banner-avatar {
  position: absolute; bottom: -22px; right: 16px;
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(255,255,255,.9); color: #202124;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,.2);
}
.card-body { padding: 28px 16px 12px; min-height: 20px; }
.card-teacher { font-size: 14px; color: var(--gc-text-secondary); }
.card-meta { font-size: 12px; color: var(--gc-text-tertiary); margin-top: 4px; }
.card-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; border-top: 1px solid var(--gc-border);
}
.card-capacity { font-size: 12px; color: var(--gc-text-secondary); }
</style>
