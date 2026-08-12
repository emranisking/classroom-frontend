<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { ClassesAPI, UsersAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import Modal from '@/components/Modal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const classId = computed(() => Number(route.params.id))
const klass = ref(null)
const loading = ref(true)
const tab = ref('stream')

const assignments = ref([])
const assignmentsLoading = ref(false)

const roster = ref([])
const rosterLoading = ref(false)

const canManage = computed(() => auth.isAdmin || auth.isTeacher)

const createModalOpen = ref(false)
const creating = ref(false)
const form = ref({ title: '', description: '', deadline: '', maxMarks: 100 })
const formError = ref('')

const assignTeacherOpen = ref(false)
const teachers = ref([])
const teachersLoading = ref(false)
const selectedTeacherId = ref('')
const assigningTeacher = ref(false)

async function loadClass() {
  loading.value = true
  try {
    const res = await ClassesAPI.get(classId.value)
    klass.value = res.data.data
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load this class.'))
  } finally {
    loading.value = false
  }
}

async function loadAssignments() {
  assignmentsLoading.value = true
  try {
    const res = await ClassesAPI.assignments(classId.value, { pageNumber: 1, pageSize: 50 })
    assignments.value = res.data.data?.items || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load assignments.'))
  } finally {
    assignmentsLoading.value = false
  }
}

async function loadRoster() {
  if (!canManage.value) return
  rosterLoading.value = true
  try {
    const res = await ClassesAPI.roster(classId.value)
    roster.value = res.data.data || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load the class roster.'))
  } finally {
    rosterLoading.value = false
  }
}

function selectTab(t) {
  tab.value = t
  if (t === 'classwork' && assignments.value.length === 0) loadAssignments()
  if (t === 'people' && roster.value.length === 0) loadRoster()
}

async function submitAssignment() {
  formError.value = ''
  if (!form.value.title || !form.value.deadline || !form.value.maxMarks) {
    formError.value = 'Title, deadline, and max marks are required.'
    return
  }
  creating.value = true
  try {
    await ClassesAPI.createAssignment(classId.value, {
      title: form.value.title,
      description: form.value.description,
      deadline: new Date(form.value.deadline).toISOString(),
      maxMarks: Number(form.value.maxMarks)
    })
    toast.success('Assignment created as a draft.')
    createModalOpen.value = false
    form.value = { title: '', description: '', deadline: '', maxMarks: 100 }
    loadAssignments()
  } catch (e) {
    formError.value = apiMessage(e, 'Could not create the assignment.')
  } finally {
    creating.value = false
  }
}

async function openAssignTeacher() {
  assignTeacherOpen.value = true
  teachersLoading.value = true
  try {
    const res = await UsersAPI.list({ pageNumber: 1, pageSize: 100, role: 'Teacher' })
    teachers.value = res.data.data?.items || []
    selectedTeacherId.value = klass.value?.teacherId || ''
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load teachers.'))
  } finally {
    teachersLoading.value = false
  }
}

async function assignTeacher() {
  if (!selectedTeacherId.value) return
  assigningTeacher.value = true
  try {
    await ClassesAPI.assignTeacher(classId.value, Number(selectedTeacherId.value))
    toast.success('Teacher assigned.')
    assignTeacherOpen.value = false
    loadClass()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not assign teacher.'))
  } finally {
    assigningTeacher.value = false
  }
}

async function setStatus(status) {
  try {
    await ClassesAPI.setStatus(classId.value, status)
    toast.success(`Class marked ${status}.`)
    loadClass()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not update class status.'))
  }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function statusChip(status) {
  return `chip-${(status || '').toLowerCase()}`
}

onMounted(async () => {
  await loadClass()
  loadAssignments()
})
</script>

<template>
  <div>
    <button class="back-link" @click="router.push({ name: 'dashboard' })">
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#5f6368" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Back to classes
    </button>

    <LoadingSpinner v-if="loading" />

    <template v-else-if="klass">
      <div class="class-header">
        <div>
          <h1>{{ klass.courseCode }} — {{ klass.name }}</h1>
          <p class="class-sub">
            {{ klass.teacherName || 'Unassigned teacher' }} ·
            {{ klass.dayOfWeek }} {{ klass.startTime }}–{{ klass.endTime }} ·
            <span class="chip" :class="statusChip(klass.status)">{{ klass.status }}</span>
          </p>
        </div>
        <div class="header-actions" v-if="canManage">
          <button v-if="auth.isAdmin" class="btn btn-outline" @click="openAssignTeacher">Assign teacher</button>
          <button v-if="auth.isAdmin && klass.status === 'Open'" class="btn btn-outline" @click="setStatus('Closed')">Close class</button>
          <button v-if="auth.isAdmin && klass.status !== 'Open'" class="btn btn-outline" @click="setStatus('Open')">Reopen class</button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'stream' }" @click="selectTab('stream')">Stream</button>
        <button class="tab" :class="{ active: tab === 'classwork' }" @click="selectTab('classwork')">Classwork</button>
        <button v-if="canManage" class="tab" :class="{ active: tab === 'people' }" @click="selectTab('people')">People</button>
      </div>

      <div v-if="tab === 'stream'" class="tab-panel">
        <div class="card stream-card">
          <h3>About this class</h3>
          <dl class="about-list">
            <dt>Course</dt><dd>{{ klass.courseCode }}{{ klass.courseName ? ` — ${klass.courseName}` : '' }}</dd>
            <dt>Teacher</dt><dd>{{ klass.teacherName || 'Unassigned' }}</dd>
            <dt>Schedule</dt><dd>{{ klass.dayOfWeek }}, {{ klass.startTime }}–{{ klass.endTime }}</dd>
            <dt>Capacity</dt><dd>{{ klass.enrolledCount ?? 0 }} / {{ klass.capacity }} students enrolled</dd>
            <dt>Enrollment deadline</dt><dd>{{ fmtDate(klass.enrollmentDeadline) }}</dd>
            <dt>Status</dt><dd><span class="chip" :class="statusChip(klass.status)">{{ klass.status }}</span></dd>
          </dl>
        </div>
      </div>

      <div v-else-if="tab === 'classwork'" class="tab-panel">
        <div class="classwork-toolbar" v-if="canManage">
          <button class="btn btn-primary" @click="createModalOpen = true">+ Create assignment</button>
        </div>
        <LoadingSpinner v-if="assignmentsLoading" />
        <EmptyState v-else-if="assignments.length === 0" title="No classwork yet" message="Assignments posted to this class will show up here." />
        <ul v-else class="assignment-list">
          <li v-for="a in assignments" :key="a.id" class="assignment-item" @click="router.push(`/assignments/${a.id}`)">
            <div class="assignment-icon">📄</div>
            <div class="assignment-info">
              <div class="assignment-title">{{ a.title }}</div>
              <div class="assignment-meta">Due {{ fmtDate(a.deadline) }} · {{ a.maxMarks }} points</div>
            </div>
            <span class="chip" :class="statusChip(a.status)">{{ a.status }}</span>
          </li>
        </ul>
      </div>

      <div v-else-if="tab === 'people'" class="tab-panel">
        <LoadingSpinner v-if="rosterLoading" />
        <EmptyState v-else-if="roster.length === 0" title="No students yet" message="Enrolled students will appear here." />
        <ul v-else class="roster-list">
          <li v-for="s in roster" :key="s.id || s.studentId" class="roster-item">
            <span class="avatar-sm">{{ (s.name || s.studentName || '?').slice(0,1).toUpperCase() }}</span>
            <div>
              <div class="roster-name">{{ s.name || s.studentName }}</div>
              <div class="roster-email">{{ s.email || s.studentEmail }}</div>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <Modal v-if="createModalOpen" title="Create assignment" @close="createModalOpen = false">
      <form @submit.prevent="submitAssignment">
        <div class="field">
          <label for="a-title">Title</label>
          <input id="a-title" v-model="form.title" type="text" placeholder="Homework 1" />
        </div>
        <div class="field">
          <label for="a-desc">Description</label>
          <textarea id="a-desc" v-model="form.description" rows="3" placeholder="Chapters 1–3"></textarea>
        </div>
        <div class="field">
          <label for="a-deadline">Deadline</label>
          <input id="a-deadline" v-model="form.deadline" type="datetime-local" />
        </div>
        <div class="field">
          <label for="a-marks">Max marks</label>
          <input id="a-marks" v-model="form.maxMarks" type="number" min="1" />
        </div>
        <p v-if="formError" class="field-error">{{ formError }}</p>
      </form>
      <template #footer>
        <button class="btn btn-outline" @click="createModalOpen = false">Cancel</button>
        <button class="btn btn-primary" :disabled="creating" @click="submitAssignment">{{ creating ? 'Creating…' : 'Create' }}</button>
      </template>
    </Modal>

    <Modal v-if="assignTeacherOpen" title="Assign teacher" @close="assignTeacherOpen = false">
      <LoadingSpinner v-if="teachersLoading" />
      <div v-else class="field">
        <label for="teacher-select">Teacher</label>
        <select id="teacher-select" v-model="selectedTeacherId">
          <option value="" disabled>Choose a teacher</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }} ({{ t.email }})</option>
        </select>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="assignTeacherOpen = false">Cancel</button>
        <button class="btn btn-primary" :disabled="assigningTeacher || !selectedTeacherId" @click="assignTeacher">
          {{ assigningTeacher ? 'Assigning…' : 'Assign' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; color: var(--gc-text-secondary);
  font-size: 14px; padding: 8px 0; margin-bottom: 8px;
}
.back-link:hover { color: var(--gc-text); }
.class-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 8px;
}
.class-header h1 { font-family: 'Google Sans', Roboto, sans-serif; font-size: 24px; margin: 0 0 6px; font-weight: 500; }
.class-sub { color: var(--gc-text-secondary); font-size: 14px; margin: 0; display: flex; align-items: center; gap: 8px; }
.header-actions { display: flex; gap: 8px; }

.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--gc-border); margin: 20px 0; }
.tab {
  background: none; border: none; padding: 12px 18px;
  font-size: 14px; font-weight: 500; color: var(--gc-text-secondary);
  border-bottom: 3px solid transparent; letter-spacing: .03em;
}
.tab:hover { color: var(--gc-text); }
.tab.active { color: var(--gc-blue); border-bottom-color: var(--gc-blue); }

.tab-panel { max-width: 760px; }
.stream-card { padding: 24px; }
.stream-card h3 { margin: 0 0 16px; font-family: 'Google Sans', Roboto, sans-serif; font-weight: 500; }
.about-list { display: grid; grid-template-columns: 160px 1fr; gap: 10px 16px; margin: 0; }
.about-list dt { color: var(--gc-text-secondary); font-size: 13px; }
.about-list dd { margin: 0; font-size: 14px; }

.classwork-toolbar { margin-bottom: 16px; }
.assignment-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.assignment-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; border: 1px solid var(--gc-border); border-radius: 8px;
  background: #fff; cursor: pointer; transition: box-shadow .12s ease;
}
.assignment-item:hover { box-shadow: var(--gc-shadow); }
.assignment-icon { font-size: 22px; }
.assignment-info { flex: 1; min-width: 0; }
.assignment-title { font-weight: 500; font-size: 14px; }
.assignment-meta { font-size: 12px; color: var(--gc-text-secondary); margin-top: 2px; }

.roster-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.roster-item { display: flex; align-items: center; gap: 14px; padding: 12px 8px; border-bottom: 1px solid var(--gc-border); }
.avatar-sm { width: 36px; height: 36px; border-radius: 50%; background: var(--gc-blue); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; }
.roster-name { font-size: 14px; font-weight: 500; }
.roster-email { font-size: 12px; color: var(--gc-text-secondary); }

textarea { font-family: inherit; resize: vertical; }
</style>
