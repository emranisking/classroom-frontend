<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { AssignmentsAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import Modal from '@/components/Modal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const assignmentId = computed(() => Number(route.params.id))
const assignment = ref(null)
const loading = ref(true)
const canManage = computed(() => auth.isAdmin || auth.isTeacher)

const submissions = ref([])
const submissionsLoading = ref(false)

const fileInput = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const mySubmission = ref(null)
const submitError = ref('')

const editOpen = ref(false)
const editForm = ref({ title: '', description: '', deadline: '', maxMarks: 100 })
const saving = ref(false)
const editError = ref('')

async function loadAssignment() {
  loading.value = true
  try {
    const res = await AssignmentsAPI.get(assignmentId.value)
    assignment.value = res.data.data
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load this assignment.'))
  } finally {
    loading.value = false
  }
}

async function loadSubmissions() {
  if (!canManage.value) return
  submissionsLoading.value = true
  try {
    const res = await AssignmentsAPI.submissions(assignmentId.value, { pageNumber: 1, pageSize: 50 })
    submissions.value = res.data.data?.items || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load submissions.'))
  } finally {
    submissionsLoading.value = false
  }
}

function pickFile() {
  fileInput.value?.click()
}

async function onFileChosen(e) {
  const file = e.target.files?.[0]
  if (!file) return
  submitError.value = ''
  if (file.type !== 'application/pdf') {
    submitError.value = 'Only PDF files are accepted.'
    return
  }
  if (file.size > 15 * 1024 * 1024) {
    submitError.value = 'File must be 15 MB or smaller.'
    return
  }
  uploading.value = true
  uploadProgress.value = 0
  try {
    const res = await AssignmentsAPI.submit(assignmentId.value, file, (evt) => {
      if (evt.total) uploadProgress.value = Math.round((evt.loaded / evt.total) * 100)
    })
    mySubmission.value = res.data.data
    toast.success('Submission uploaded.')
  } catch (e) {
    submitError.value = apiMessage(e, 'Could not upload your submission.')
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

async function doPublish() {
  try {
    await AssignmentsAPI.publish(assignmentId.value)
    toast.success('Assignment published.')
    loadAssignment()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not publish the assignment.'))
  }
}

async function doPublishResults() {
  try {
    await AssignmentsAPI.publishResults(assignmentId.value)
    toast.success('Results published to students.')
    loadAssignment()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not publish results.'))
  }
}

async function doDelete() {
  if (!confirm('Delete this assignment? This cannot be undone.')) return
  try {
    await AssignmentsAPI.remove(assignmentId.value)
    toast.success('Assignment deleted.')
    router.back()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not delete the assignment.'))
  }
}

function openEdit() {
  editForm.value = {
    title: assignment.value.title,
    description: assignment.value.description || '',
    deadline: assignment.value.deadline ? assignment.value.deadline.slice(0, 16) : '',
    maxMarks: assignment.value.maxMarks
  }
  editOpen.value = true
}

async function saveEdit() {
  editError.value = ''
  if (!editForm.value.title || !editForm.value.deadline || !editForm.value.maxMarks) {
    editError.value = 'Title, deadline, and max marks are required.'
    return
  }
  saving.value = true
  try {
    await AssignmentsAPI.update(assignmentId.value, {
      title: editForm.value.title,
      description: editForm.value.description,
      deadline: new Date(editForm.value.deadline).toISOString(),
      maxMarks: Number(editForm.value.maxMarks)
    })
    toast.success('Assignment updated.')
    editOpen.value = false
    loadAssignment()
  } catch (e) {
    editError.value = apiMessage(e, 'Could not update the assignment.')
  } finally {
    saving.value = false
  }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(async () => {
  await loadAssignment()
  loadSubmissions()
})
</script>

<template>
  <div>
    <button class="back-link" @click="router.back()">
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#5f6368" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Back
    </button>

    <LoadingSpinner v-if="loading" />

    <template v-else-if="assignment">
      <div class="assign-header">
        <div>
          <h1>{{ assignment.title }}</h1>
          <p class="assign-sub">
            Due {{ fmtDate(assignment.deadline) }} · {{ assignment.maxMarks }} points ·
            <span class="chip" :class="`chip-${(assignment.status || '').toLowerCase()}`">{{ assignment.status }}</span>
          </p>
        </div>
        <div class="header-actions" v-if="canManage">
          <button class="btn btn-outline" @click="openEdit">Edit</button>
          <button v-if="assignment.status === 'Draft'" class="btn btn-primary" @click="doPublish">Publish</button>
          <button v-if="assignment.status === 'Published'" class="btn btn-primary" @click="doPublishResults">Publish results</button>
          <button class="btn btn-danger" @click="doDelete">Delete</button>
        </div>
      </div>

      <div class="card assign-card">
        <p class="assign-desc">{{ assignment.description || 'No description provided.' }}</p>
      </div>

      <!-- Student submission panel -->
      <div v-if="auth.isStudent" class="card submit-card">
        <h3>Your work</h3>
        <div v-if="mySubmission" class="submitted-box">
          <span class="chip chip-submitted">Submitted</span>
          <span class="submitted-text">Uploaded successfully.</span>
          <router-link :to="`/submissions/${mySubmission.id}`" class="btn btn-text">View submission</router-link>
        </div>
        <div v-else>
          <input ref="fileInput" type="file" accept="application/pdf" class="hidden-input" @change="onFileChosen" />
          <button class="btn btn-primary" :disabled="uploading" @click="pickFile">
            {{ uploading ? `Uploading… ${uploadProgress}%` : 'Upload PDF' }}
          </button>
          <p class="hint">PDF only, up to 15 MB.</p>
          <p v-if="submitError" class="field-error">{{ submitError }}</p>
        </div>
      </div>

      <!-- Teacher/admin submissions list -->
      <div v-if="canManage" class="card submissions-card">
        <h3>Submissions</h3>
        <LoadingSpinner v-if="submissionsLoading" />
        <EmptyState v-else-if="submissions.length === 0" title="No submissions yet" message="Student submissions will appear here." />
        <table v-else class="sub-table">
          <thead>
            <tr><th>Student</th><th>Status</th><th>Submitted</th><th>Marks</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="s in submissions" :key="s.id">
              <td>{{ s.studentName }}</td>
              <td><span class="chip" :class="`chip-${(s.status || '').toLowerCase()}`">{{ s.status }}</span></td>
              <td>{{ fmtDate(s.submittedAt) }}</td>
              <td>{{ s.marks != null ? `${s.marks}/${assignment.maxMarks}` : '—' }}</td>
              <td><router-link :to="`/submissions/${s.id}`" class="btn btn-text">Open</router-link></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <Modal v-if="editOpen" title="Edit assignment" @close="editOpen = false">
      <form @submit.prevent="saveEdit">
        <div class="field">
          <label for="e-title">Title</label>
          <input id="e-title" v-model="editForm.title" type="text" />
        </div>
        <div class="field">
          <label for="e-desc">Description</label>
          <textarea id="e-desc" v-model="editForm.description" rows="3"></textarea>
        </div>
        <div class="field">
          <label for="e-deadline">Deadline</label>
          <input id="e-deadline" v-model="editForm.deadline" type="datetime-local" />
        </div>
        <div class="field">
          <label for="e-marks">Max marks</label>
          <input id="e-marks" v-model="editForm.maxMarks" type="number" min="1" />
        </div>
        <p v-if="editError" class="field-error">{{ editError }}</p>
      </form>
      <template #footer>
        <button class="btn btn-outline" @click="editOpen = false">Cancel</button>
        <button class="btn btn-primary" :disabled="saving" @click="saveEdit">{{ saving ? 'Saving…' : 'Save' }}</button>
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
.assign-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.assign-header h1 { font-family: 'Google Sans', Roboto, sans-serif; font-size: 22px; margin: 0 0 6px; font-weight: 500; }
.assign-sub { color: var(--gc-text-secondary); font-size: 14px; margin: 0; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.assign-card, .submit-card, .submissions-card { max-width: 760px; padding: 20px 24px; margin-bottom: 20px; }
.assign-desc { white-space: pre-wrap; font-size: 14px; line-height: 1.6; margin: 0; }
.submit-card h3, .submissions-card h3 { margin: 0 0 14px; font-family: 'Google Sans', Roboto, sans-serif; font-weight: 500; }
.hidden-input { display: none; }
.hint { font-size: 12px; color: var(--gc-text-tertiary); margin: 8px 0 0; }
.submitted-box { display: flex; align-items: center; gap: 12px; }
.submitted-text { font-size: 14px; color: var(--gc-text-secondary); }
.sub-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.sub-table th { text-align: left; color: var(--gc-text-secondary); font-weight: 500; padding: 8px; border-bottom: 1px solid var(--gc-border); font-size: 12px; text-transform: uppercase; }
.sub-table td { padding: 10px 8px; border-bottom: 1px solid var(--gc-border); }
textarea { font-family: inherit; resize: vertical; }
</style>
