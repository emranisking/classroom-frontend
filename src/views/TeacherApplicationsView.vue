<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { TeacherApplicationsAPI, CoursesAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import Modal from '@/components/Modal.vue'

const auth = useAuthStore()
const toast = useToastStore()

const applications = ref([])
const loading = ref(true)
const actingId = ref(null)

const applyOpen = ref(false)
const courses = ref([])
const coursesLoading = ref(false)
const selectedCourseId = ref('')
const applying = ref(false)
const applyError = ref('')

async function load() {
  loading.value = true
  try {
    const res = await TeacherApplicationsAPI.list({ pageNumber: 1, pageSize: 50 })
    applications.value = res.data.data?.items || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load applications.'))
  } finally {
    loading.value = false
  }
}

async function openApply() {
  applyOpen.value = true
  coursesLoading.value = true
  try {
    const res = await CoursesAPI.list({ pageNumber: 1, pageSize: 100 })
    courses.value = res.data.data?.items || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load courses.'))
  } finally {
    coursesLoading.value = false
  }
}

async function submitApplication() {
  applyError.value = ''
  if (!selectedCourseId.value) {
    applyError.value = 'Choose a course to apply for.'
    return
  }
  applying.value = true
  try {
    await TeacherApplicationsAPI.apply(Number(selectedCourseId.value))
    toast.success('Application submitted.')
    applyOpen.value = false
    selectedCourseId.value = ''
    load()
  } catch (e) {
    applyError.value = apiMessage(e, 'Could not submit your application.')
  } finally {
    applying.value = false
  }
}

async function approve(app) {
  actingId.value = app.id
  try {
    await TeacherApplicationsAPI.approve(app.id)
    toast.success('Application approved.')
    load()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not approve this application.'))
  } finally {
    actingId.value = null
  }
}

async function reject(app) {
  actingId.value = app.id
  try {
    await TeacherApplicationsAPI.reject(app.id)
    toast.success('Application rejected.')
    load()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not reject this application.'))
  } finally {
    actingId.value = null
  }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Teacher applications</h1>
      <button v-if="auth.isTeacher" class="btn btn-primary" @click="openApply">Apply to teach a course</button>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="applications.length === 0" title="No applications" message="Applications to teach courses will appear here." />

    <ul v-else class="app-list">
      <li v-for="a in applications" :key="a.id" class="app-item">
        <div>
          <div class="app-title">{{ a.courseName || `Course #${a.courseId}` }} <span v-if="a.courseCode">({{ a.courseCode }})</span></div>
          <div class="app-meta">{{ a.teacherName ? `${a.teacherName} · ` : '' }}Applied {{ fmtDate(a.createdAt) }}</div>
        </div>
        <div class="app-right">
          <span class="chip" :class="`chip-${(a.status || '').toLowerCase()}`">{{ a.status }}</span>
          <template v-if="auth.isAdmin && a.status === 'Pending'">
            <button class="btn btn-outline" :disabled="actingId === a.id" @click="reject(a)">Reject</button>
            <button class="btn btn-primary" :disabled="actingId === a.id" @click="approve(a)">Approve</button>
          </template>
        </div>
      </li>
    </ul>

    <Modal v-if="applyOpen" title="Apply to teach a course" @close="applyOpen = false">
      <LoadingSpinner v-if="coursesLoading" />
      <div v-else class="field">
        <label for="course-select">Course</label>
        <select id="course-select" v-model="selectedCourseId">
          <option value="" disabled>Choose a course</option>
          <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.code }} — {{ c.name }}</option>
        </select>
      </div>
      <p v-if="applyError" class="field-error">{{ applyError }}</p>
      <template #footer>
        <button class="btn btn-outline" @click="applyOpen = false">Cancel</button>
        <button class="btn btn-primary" :disabled="applying" @click="submitApplication">
          {{ applying ? 'Submitting…' : 'Submit application' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 26px; font-weight: 500; margin: 0; }
.app-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; max-width: 760px; }
.app-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border: 1px solid var(--gc-border); border-radius: 8px; background: #fff; }
.app-title { font-weight: 500; font-size: 14px; }
.app-meta { font-size: 12px; color: var(--gc-text-secondary); margin-top: 2px; }
.app-right { display: flex; align-items: center; gap: 8px; }
</style>
