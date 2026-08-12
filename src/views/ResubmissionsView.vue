<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import { ResubmissionsAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'

const toast = useToastStore()
const requests = ref([])
const loading = ref(true)
const actingId = ref(null)

async function load() {
  loading.value = true
  try {
    const res = await ResubmissionsAPI.list({ pageNumber: 1, pageSize: 50 })
    requests.value = res.data.data?.items || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load resubmission requests.'))
  } finally {
    loading.value = false
  }
}

async function approve(r) {
  actingId.value = r.id
  try {
    await ResubmissionsAPI.approve(r.id)
    toast.success('Resubmission approved.')
    load()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not approve this request.'))
  } finally {
    actingId.value = null
  }
}

async function reject(r) {
  actingId.value = r.id
  try {
    await ResubmissionsAPI.reject(r.id)
    toast.success('Resubmission rejected.')
    load()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not reject this request.'))
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
    <h1 class="page-title">Resubmission requests</h1>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="requests.length === 0" title="No requests" message="Student resubmission requests will appear here." />

    <ul v-else class="req-list">
      <li v-for="r in requests" :key="r.id" class="req-item">
        <div class="req-main">
          <div class="req-title">{{ r.studentName ? `${r.studentName} — ` : '' }}Submission #{{ r.submissionId }}</div>
          <div class="req-reason">"{{ r.reason }}"</div>
          <div class="req-meta">Requested {{ fmtDate(r.createdAt) }}</div>
        </div>
        <div class="req-right">
          <span class="chip" :class="`chip-${(r.status || '').toLowerCase()}`">{{ r.status }}</span>
          <template v-if="r.status === 'Pending'">
            <button class="btn btn-outline" :disabled="actingId === r.id" @click="reject(r)">Reject</button>
            <button class="btn btn-primary" :disabled="actingId === r.id" @click="approve(r)">Approve</button>
          </template>
          <router-link v-else :to="`/submissions/${r.submissionId}`" class="btn btn-text">View submission</router-link>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.page-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 26px; font-weight: 500; margin: 0 0 24px; }
.req-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; max-width: 760px; }
.req-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 16px; border: 1px solid var(--gc-border); border-radius: 8px; background: #fff; }
.req-title { font-weight: 500; font-size: 14px; }
.req-reason { font-size: 13px; color: var(--gc-text-secondary); margin-top: 4px; font-style: italic; }
.req-meta { font-size: 12px; color: var(--gc-text-tertiary); margin-top: 4px; }
.req-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
</style>
