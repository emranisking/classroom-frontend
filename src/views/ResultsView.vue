<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToastStore } from '@/stores/toast'
import { ResultsAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'

const toast = useToastStore()
const results = ref([])
const loading = ref(true)

const gradedCount = computed(() => results.value.length)
const average = computed(() => {
  if (!results.value.length) return null
  const pct = results.value.reduce((sum, r) => sum + (r.marks / r.maxMarks) * 100, 0) / results.value.length
  return Math.round(pct * 10) / 10
})

async function load() {
  loading.value = true
  try {
    const res = await ResultsAPI.me()
    results.value = res.data.data || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load your results.'))
  } finally {
    loading.value = false
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
    <h1 class="page-title">Results</h1>

    <LoadingSpinner v-if="loading" />

    <EmptyState v-else-if="results.length === 0" title="No published results" message="Your grades will appear here once teachers publish them." />

    <template v-else>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ gradedCount }}</div>
          <div class="stat-label">Graded assignments</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ average }}%</div>
          <div class="stat-label">Average score</div>
        </div>
      </div>

      <table class="results-table">
        <thead>
          <tr>
            <th>Assignment</th><th>Class</th><th>Score</th><th>Graded</th><th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in results" :key="r.assignmentId">
            <td>{{ r.assignmentTitle }}</td>
            <td>{{ r.courseCode }} — {{ r.className }}</td>
            <td class="score-cell">{{ r.marks }}/{{ r.maxMarks }}</td>
            <td>{{ fmtDate(r.gradedAt) }}</td>
            <td class="feedback-cell">{{ r.feedback || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.page-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 26px; font-weight: 500; margin: 0 0 24px; }
.stats-row { display: flex; gap: 16px; margin-bottom: 24px; }
.stat-card { background: #fff; border: 1px solid var(--gc-border); border-radius: 8px; padding: 18px 24px; min-width: 160px; }
.stat-value { font-size: 28px; font-weight: 500; color: var(--gc-blue); font-family: 'Google Sans', Roboto, sans-serif; }
.stat-label { font-size: 12px; color: var(--gc-text-secondary); margin-top: 4px; }
.results-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid var(--gc-border); border-radius: 8px; overflow: hidden; font-size: 14px; }
.results-table th { text-align: left; padding: 12px 16px; background: var(--gc-bg); color: var(--gc-text-secondary); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
.results-table td { padding: 12px 16px; border-top: 1px solid var(--gc-border); }
.score-cell { font-weight: 500; }
.feedback-cell { color: var(--gc-text-secondary); max-width: 260px; }
</style>
