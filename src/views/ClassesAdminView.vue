<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import { ClassesAPI, CoursesAPI, UsersAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import Modal from '@/components/Modal.vue'

const toast = useToastStore()
const classes = ref([])
const courses = ref([])
const loading = ref(true)

const modalOpen = ref(false)
const saving = ref(false)
const formError = ref('')
const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const form = ref({
  courseId: '', name: '', dayOfWeek: 'Monday',
  startTime: '09:00', endTime: '11:00', capacity: 40, enrollmentDeadline: ''
})

async function load() {
  loading.value = true
  try {
    const [classRes, courseRes] = await Promise.all([
      ClassesAPI.list({ pageNumber: 1, pageSize: 100 }),
      CoursesAPI.list({ pageNumber: 1, pageSize: 100 })
    ])
    classes.value = classRes.data.data?.items || []
    courses.value = courseRes.data.data?.items || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load classes.'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  formError.value = ''
  form.value = {
    courseId: courses.value[0]?.id || '', name: '', dayOfWeek: 'Monday',
    startTime: '09:00', endTime: '11:00', capacity: 40, enrollmentDeadline: ''
  }
  modalOpen.value = true
}

async function save() {
  formError.value = ''
  if (!form.value.courseId || !form.value.name || !form.value.capacity || !form.value.enrollmentDeadline) {
    formError.value = 'Fill in all required fields.'
    return
  }
  saving.value = true
  try {
    await ClassesAPI.create({
      courseId: Number(form.value.courseId),
      name: form.value.name,
      dayOfWeek: form.value.dayOfWeek,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      capacity: Number(form.value.capacity),
      enrollmentDeadline: new Date(form.value.enrollmentDeadline).toISOString()
    })
    toast.success('Class created.')
    modalOpen.value = false
    load()
  } catch (e) {
    formError.value = apiMessage(e, 'Could not create the class.')
  } finally {
    saving.value = false
  }
}

async function setStatus(c, status) {
  try {
    await ClassesAPI.setStatus(c.id, status)
    toast.success(`Class marked ${status}.`)
    load()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not update class status.'))
  }
}

function courseLabel(id) {
  const c = courses.value.find(c => c.id === id)
  return c ? `${c.code} — ${c.name}` : ''
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Classes</h1>
      <button class="btn btn-primary" @click="openCreate">+ New class</button>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="classes.length === 0" title="No classes yet" message="Create a class to open enrollment." />

    <table v-else class="data-table">
      <thead>
        <tr><th>Course</th><th>Section</th><th>Teacher</th><th>Schedule</th><th>Seats</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="c in classes" :key="c.id">
          <td>{{ c.courseCode }}</td>
          <td><router-link :to="`/classes/${c.id}`">{{ c.name }}</router-link></td>
          <td>{{ c.teacherName || '—' }}</td>
          <td>{{ c.dayOfWeek }} {{ c.startTime }}–{{ c.endTime }}</td>
          <td>{{ c.enrolledCount ?? 0 }}/{{ c.capacity }}</td>
          <td><span class="chip" :class="`chip-${(c.status || '').toLowerCase()}`">{{ c.status }}</span></td>
          <td class="actions-cell">
            <button v-if="c.status === 'Open'" class="btn btn-text" @click="setStatus(c, 'Closed')">Close</button>
            <button v-else class="btn btn-text" @click="setStatus(c, 'Open')">Reopen</button>
            <button class="btn btn-text danger-text" @click="setStatus(c, 'Cancelled')">Cancel</button>
          </td>
        </tr>
      </tbody>
    </table>

    <Modal v-if="modalOpen" title="New class" @close="modalOpen = false" width="560px">
      <form @submit.prevent="save">
        <div class="field">
          <label for="course">Course</label>
          <select id="course" v-model="form.courseId">
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.code }} — {{ c.name }}</option>
          </select>
        </div>
        <div class="field">
          <label for="section">Section name</label>
          <input id="section" v-model="form.name" type="text" placeholder="Section B" />
        </div>
        <div class="form-row">
          <div class="field">
            <label for="day">Day of week</label>
            <select id="day" v-model="form.dayOfWeek">
              <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <div class="field">
            <label for="start">Start time</label>
            <input id="start" v-model="form.startTime" type="time" />
          </div>
          <div class="field">
            <label for="end">End time</label>
            <input id="end" v-model="form.endTime" type="time" />
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="capacity">Capacity</label>
            <input id="capacity" v-model="form.capacity" type="number" min="1" />
          </div>
          <div class="field">
            <label for="deadline">Enrollment deadline</label>
            <input id="deadline" v-model="form.enrollmentDeadline" type="datetime-local" />
          </div>
        </div>
        <p v-if="formError" class="field-error">{{ formError }}</p>
      </form>
      <template #footer>
        <button class="btn btn-outline" @click="modalOpen = false">Cancel</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? 'Creating…' : 'Create' }}</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 26px; font-weight: 500; margin: 0; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid var(--gc-border); border-radius: 8px; overflow: hidden; font-size: 14px; }
.data-table th { text-align: left; padding: 12px 16px; background: var(--gc-bg); color: var(--gc-text-secondary); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
.data-table td { padding: 12px 16px; border-top: 1px solid var(--gc-border); }
.data-table a { color: var(--gc-blue); }
.actions-cell { display: flex; gap: 4px; white-space: nowrap; }
.danger-text { color: var(--gc-red); }
.form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
</style>
