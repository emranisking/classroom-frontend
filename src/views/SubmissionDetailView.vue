<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { SubmissionsAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import { http } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Modal from '@/components/Modal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const submissionId = computed(() => Number(route.params.id))
const submission = ref(null)
const versions = ref([])
const loading = ref(true)
const canGrade = computed(() => auth.isAdmin || auth.isTeacher)

const gradeOpen = ref(false)
const gradeForm = ref({ marks: '', feedback: '' })
const grading = ref(false)
const gradeError = ref('')

const resubmitOpen = ref(false)
const resubmitReason = ref('')
const requestingResubmit = ref(false)
const resubmitError = ref('')

const uploadInput = ref(null)
const uploadingVersion = ref(false)

async function loadAll() {
  loading.value = true
  try {
    const [subRes, verRes] = await Promise.all([
      SubmissionsAPI.get(submissionId.value),
      SubmissionsAPI.versions(submissionId.value)
    ])
    submission.value = subRes.data.data
    versions.value = verRes.data.data || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load this submission.'))
  } finally {
    loading.value = false
  }
}

async function downloadFile(version) {
  try {
    const res = await http.get(`/submissions/${submissionId.value}/download`, {
      params: version ? { version } : {},
      responseType: 'blob'
    })
    const blobUrl = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `submission-${submissionId.value}${version ? `-v${version}` : ''}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (e) {
    toast.error(apiMessage(e, 'Could not download the file.'))
  }
}

function openGrade() {
  gradeForm.value = { marks: submission.value?.marks ?? '', feedback: submission.value?.feedback ?? '' }
  gradeOpen.value = true
}

async function submitGrade() {
  gradeError.value = ''
  if (gradeForm.value.marks === '' || gradeForm.value.marks === null) {
    gradeError.value = 'Enter marks to grade this submission.'
    return
  }
  grading.value = true
  try {
    await SubmissionsAPI.grade(submissionId.value, {
      marks: Number(gradeForm.value.marks),
      feedback: gradeForm.value.feedback
    })
    toast.success('Submission graded.')
    gradeOpen.value = false
    loadAll()
  } catch (e) {
    gradeError.value = apiMessage(e, 'Could not save the grade.')
  } finally {
    grading.value = false
  }
}

async function submitResubmitRequest() {
  resubmitError.value = ''
  if (!resubmitReason.value.trim()) {
    resubmitError.value = 'Tell your teacher why you need to resubmit.'
    return
  }
  requestingResubmit.value = true
  try {
    await SubmissionsAPI.requestResubmission(submissionId.value, resubmitReason.value)
    toast.success('Resubmission requested.')
    resubmitOpen.value = false
    resubmitReason.value = ''
  } catch (e) {
    resubmitError.value = apiMessage(e, 'Could not request a resubmission.')
  } finally {
    requestingResubmit.value = false
  }
}

function pickUploadFile() {
  uploadInput.value?.click()
}

async function onUploadVersion(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingVersion.value = true
  try {
    await SubmissionsAPI.uploadVersion(submissionId.value, file)
    toast.success('New version uploaded.')
    loadAll()
  } catch (err) {
    toast.error(apiMessage(err, 'Could not upload the new version. It may not be approved for resubmission yet.'))
  } finally {
    uploadingVersion.value = false
    e.target.value = ''
  }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(loadAll)
</script>

<template>
  <div>
    <button class="back-link" @click="router.back()">
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#5f6368" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Back
    </button>

    <LoadingSpinner v-if="loading" />

    <template v-else-if="submission">
      <div class="sub-header">
        <div>
          <h1>Submission #{{ submission.id }}</h1>
          <p class="sub-meta">
            {{ submission.studentName ? `${submission.studentName} · ` : '' }}
            <span class="chip" :class="`chip-${(submission.status || '').toLowerCase()}`">{{ submission.status }}</span>
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" @click="downloadFile()">Download latest PDF</button>
          <button v-if="canGrade" class="btn btn-primary" @click="openGrade">
            {{ submission.marks != null ? 'Update grade' : 'Grade' }}
          </button>
        </div>
      </div>

      <div class="card grade-card">
        <div class="grade-row">
          <div>
            <div class="grade-label">Marks</div>
            <div class="grade-value">{{ submission.marks != null ? submission.marks : 'Not graded yet' }}</div>
          </div>
          <div>
            <div class="grade-label">Submitted</div>
            <div class="grade-value">{{ fmtDate(submission.submittedAt) }}</div>
          </div>
        </div>
        <div v-if="submission.feedback" class="feedback-box">
          <div class="grade-label">Feedback</div>
          <p>{{ submission.feedback }}</p>
        </div>
      </div>

      <div class="card versions-card">
        <h3>Version history</h3>
        <ul class="version-list">
          <li v-for="v in versions" :key="v.versionNumber" class="version-item">
            <span>Version {{ v.versionNumber }}</span>
            <span class="version-date">{{ fmtDate(v.uploadedAt) }}</span>
            <button class="btn btn-text" @click="downloadFile(v.versionNumber)">Download</button>
          </li>
          <li v-if="versions.length === 0" class="version-empty">No version history yet.</li>
        </ul>
      </div>

      <div v-if="auth.isStudent" class="card student-actions">
        <h3>Need changes?</h3>
        <p class="hint">If you'd like to fix a mistake in a graded submission, request a resubmission. A teacher must approve it before you can upload a new version.</p>
        <div class="action-row">
          <button class="btn btn-outline" @click="resubmitOpen = true">Request resubmission</button>
          <input ref="uploadInput" type="file" accept="application/pdf" class="hidden-input" @change="onUploadVersion" />
          <button class="btn btn-outline" :disabled="uploadingVersion" @click="pickUploadFile">
            {{ uploadingVersion ? 'Uploading…' : 'Upload new version' }}
          </button>
        </div>
      </div>
    </template>

    <Modal v-if="gradeOpen" title="Grade submission" @close="gradeOpen = false">
      <div class="field">
        <label for="marks">Marks</label>
        <input id="marks" v-model="gradeForm.marks" type="number" min="0" />
      </div>
      <div class="field">
        <label for="feedback">Feedback</label>
        <textarea id="feedback" v-model="gradeForm.feedback" rows="4" placeholder="Good work, tighten section 3."></textarea>
      </div>
      <p v-if="gradeError" class="field-error">{{ gradeError }}</p>
      <template #footer>
        <button class="btn btn-outline" @click="gradeOpen = false">Cancel</button>
        <button class="btn btn-primary" :disabled="grading" @click="submitGrade">{{ grading ? 'Saving…' : 'Save grade' }}</button>
      </template>
    </Modal>

    <Modal v-if="resubmitOpen" title="Request resubmission" @close="resubmitOpen = false">
      <div class="field">
        <label for="reason">Reason</label>
        <textarea id="reason" v-model="resubmitReason" rows="3" placeholder="I uploaded the wrong file."></textarea>
      </div>
      <p v-if="resubmitError" class="field-error">{{ resubmitError }}</p>
      <template #footer>
        <button class="btn btn-outline" @click="resubmitOpen = false">Cancel</button>
        <button class="btn btn-primary" :disabled="requestingResubmit" @click="submitResubmitRequest">
          {{ requestingResubmit ? 'Sending…' : 'Send request' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.back-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: var(--gc-text-secondary); font-size: 14px; padding: 8px 0; margin-bottom: 8px; }
.back-link:hover { color: var(--gc-text); }
.sub-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.sub-header h1 { font-family: 'Google Sans', Roboto, sans-serif; font-size: 22px; margin: 0 0 6px; font-weight: 500; }
.sub-meta { color: var(--gc-text-secondary); font-size: 14px; margin: 0; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.grade-card, .versions-card, .student-actions { max-width: 700px; padding: 20px 24px; margin-bottom: 20px; }
.grade-row { display: flex; gap: 48px; }
.grade-label { font-size: 12px; color: var(--gc-text-secondary); text-transform: uppercase; letter-spacing: .04em; }
.grade-value { font-size: 20px; font-weight: 500; margin-top: 4px; }
.feedback-box { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gc-border); }
.feedback-box p { margin: 4px 0 0; font-size: 14px; line-height: 1.6; }
.versions-card h3, .student-actions h3 { margin: 0 0 14px; font-family: 'Google Sans', Roboto, sans-serif; font-weight: 500; }
.version-list { list-style: none; margin: 0; padding: 0; }
.version-item { display: flex; align-items: center; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--gc-border); font-size: 14px; }
.version-date { color: var(--gc-text-secondary); font-size: 12px; flex: 1; }
.version-empty { color: var(--gc-text-tertiary); font-size: 14px; padding: 8px 0; }
.hint { font-size: 13px; color: var(--gc-text-secondary); line-height: 1.5; }
.action-row { display: flex; gap: 10px; margin-top: 8px; }
.hidden-input { display: none; }
textarea { font-family: inherit; resize: vertical; }
</style>
