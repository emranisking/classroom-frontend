<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import { EnrollmentsAPI, ClassesAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'

const toast = useToastStore()
const requests = ref([])
const enrollments = ref([])
const loading = ref(true)
const droppingId = ref(null)

async function load() {
  loading.value = true
  try {
    // Get both requests and enrollments
    const [reqRes, enrRes] = await Promise.all([
      EnrollmentsAPI.myRequests({ pageNumber: 1, pageSize: 50 }),
      EnrollmentsAPI.myEnrollments()
    ])
    
    requests.value = reqRes.data.data?.items || []
    const enrollmentData = enrRes.data.data || []
    
    // Fetch full class details for each enrollment
    if (enrollmentData.length > 0) {
      // Option 1: Fetch all classes and map
      try {
        const allClassesRes = await ClassesAPI.list({ pageNumber: 1, pageSize: 100 })
        const allClasses = allClassesRes.data.data?.items || []
        
        // Create a map of classId to class data
        const classMap = {}
        allClasses.forEach(cls => {
          classMap[cls.id] = cls
        })
        
        // Map enrollments to full class data
        enrollments.value = enrollmentData.map(enrollment => {
          const classData = classMap[enrollment.classId]
          
          if (classData) {
            return {
              ...enrollment,
              className: classData.name || enrollment.className,
              courseCode: classData.courseCode || enrollment.courseCode,
              teacherName: classData.teacherName || 'Unassigned teacher',
              dayOfWeek: classData.dayOfWeek || 'TBA',
              startTime: classData.startTime || null,
              endTime: classData.endTime || null,
              capacity: classData.capacity || 0,
              enrolledCount: classData.enrolledCount || 0
            }
          }
          return enrollment
        })
      } catch (error) {
        console.error('Failed to fetch class details:', error)
        // If fetching class details fails, use enrollment data as-is
        enrollments.value = enrollmentData
      }
    } else {
      enrollments.value = []
    }
    
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load your enrollments.'))
  } finally {
    loading.value = false
  }
}

async function refreshRequest(r) {
  try {
    const res = await EnrollmentsAPI.requestStatus(r.requestId)
    Object.assign(r, res.data.data)
    toast.info(`Status: ${r.status}`)
    if (r.status !== 'Pending') load()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not refresh status.'))
  }
}

async function dropEnrollment(e) {
  if (!confirm(`Drop ${e.className}?`)) return
  droppingId.value = e.enrollmentId
  try {
    await EnrollmentsAPI.drop(e.enrollmentId)
    toast.success('Enrollment dropped.')
    load()
  } catch (err) {
    toast.error(apiMessage(err, 'Could not drop this enrollment.'))
  } finally {
    droppingId.value = null
  }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="page-title">Enrollments</h1>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <section class="section">
        <h2>Pending &amp; recent requests</h2>
        <EmptyState v-if="requests.length === 0" title="No enrollment requests" message="Requests you make from the dashboard show up here." />
        <ul v-else class="req-list">
          <li v-for="r in requests" :key="r.requestId" class="req-item">
            <div>
              <div class="req-title">Class #{{ r.classId }}</div>
              <div class="req-meta">Requested {{ fmtDate(r.createdAt) }}<span v-if="r.reason"> · {{ r.reason }}</span></div>
            </div>
            <div class="req-right">
              <span class="chip" :class="`chip-${(r.status || '').toLowerCase()}`">{{ r.status }}</span>
              <button v-if="r.status === 'Pending'" class="btn btn-text" @click="refreshRequest(r)">Refresh</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="section">
        <h2>Active enrollments</h2>
        <EmptyState v-if="enrollments.length === 0" title="Not enrolled in any class" message="Approved enrollment requests appear here." />
        <ul v-else class="req-list">
          <li v-for="e in enrollments" :key="e.enrollmentId" class="req-item">
            <div>
              <div class="req-title">{{ e.courseCode }} — {{ e.className }}</div>
              <div class="req-meta">
                {{ e.teacherName || 'Unassigned teacher' }} 
                <span v-if="e.dayOfWeek && e.dayOfWeek !== 'TBA'">
                  · {{ e.dayOfWeek }} 
                  <span v-if="e.startTime">{{ e.startTime }}–{{ e.endTime }}</span>
                </span>
                <span v-else>
                  · Schedule not available
                </span>
              </div>
            </div>
            <div class="req-right">
              <router-link :to="`/classes/${e.classId}`" class="btn btn-text">View class</router-link>
              <button class="btn btn-outline" :disabled="droppingId === e.enrollmentId" @click="dropEnrollment(e)">
                {{ droppingId === e.enrollmentId ? 'Dropping…' : 'Drop' }}
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 26px; font-weight: 500; margin: 0 0 24px; }
.section { margin-bottom: 32px; max-width: 760px; }
.section h2 { font-size: 16px; font-weight: 500; color: var(--gc-text-secondary); margin: 0 0 12px; text-transform: uppercase; letter-spacing: .03em; font-size: 12px; }
.req-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.req-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border: 1px solid var(--gc-border); border-radius: 8px; background: #fff; }
.req-title { font-weight: 500; font-size: 14px; }
.req-meta { font-size: 12px; color: var(--gc-text-secondary); margin-top: 2px; }
.req-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
</style>