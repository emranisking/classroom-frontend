<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { ClassesAPI, CoursesAPI, EnrollmentsAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import ClassCard from '@/components/ClassCard.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import Modal from '@/components/Modal.vue'

const auth = useAuthStore()
const toast = useToastStore()

const loading = ref(true)
const classes = ref([])
const myEnrollments = ref([])
const search = ref('')

const browseModalOpen = ref(false)
const browseClasses = ref([])
const browseLoading = ref(false)
const requestingId = ref(null)

async function loadDashboard() {
  loading.value = true
  try {
    if (auth.isStudent) {
      // Step 1: Get enrollments
      const enrollmentsRes = await EnrollmentsAPI.myEnrollments()
      myEnrollments.value = enrollmentsRes.data.data || []
      
      // Step 2: Get all classes (students should have permission to list)
      const allClassesRes = await ClassesAPI.list({ pageNumber: 1, pageSize: 100 })
      const allClasses = allClassesRes.data.data?.items || []
      
      console.log('All classes:', allClasses) // Debug - check if teacher data is here
      
      // Step 3: Create a map of classId to class data
      const classMap = {}
      allClasses.forEach(cls => {
        classMap[cls.id] = cls
      })
      
      // Step 4: Map enrollments to full class data
      classes.value = myEnrollments.value.map(enrollment => {
        const classData = classMap[enrollment.classId]
        
        if (classData) {
          // Merge class data with enrollment data
          return {
            id: classData.id,
            name: classData.name || enrollment.className,
            courseCode: classData.courseCode || enrollment.courseCode,
            courseId: classData.courseId,
            teacherName: classData.teacherName || 'Unassigned teacher',
            dayOfWeek: classData.dayOfWeek || 'TBA',
            startTime: classData.startTime || null,
            endTime: classData.endTime || null,
            status: enrollment.status || classData.status || 'Active',
            capacity: classData.capacity || 0,
            enrolledCount: classData.enrolledCount || 0,
            enrolledAt: enrollment.enrolledAt
          }
        } else {
          // Fallback if class not found in the list
          return {
            id: enrollment.classId,
            name: enrollment.className,
            courseCode: enrollment.courseCode,
            courseId: enrollment.courseId,
            teacherName: 'Unassigned teacher',
            dayOfWeek: 'TBA',
            startTime: null,
            endTime: null,
            status: enrollment.status || 'Active',
            capacity: 0,
            enrolledCount: 0,
            enrolledAt: enrollment.enrolledAt
          }
        }
      })
      
      console.log('Final classes with teacher data:', classes.value) // Debug
      
    } else {
      // For teachers and admins, just get the class list
      const res = await ClassesAPI.list({ pageNumber: 1, pageSize: 50 })
      classes.value = res.data.data?.items || []
    }
  } catch (e) {
    console.error('Load error:', e)
    toast.error(apiMessage(e, 'Could not load your classes.'))
  } finally {
    loading.value = false
  }
}

async function openBrowse() {
  browseModalOpen.value = true
  browseLoading.value = true
  try {
    const res = await ClassesAPI.list({ pageNumber: 1, pageSize: 50 })
    const enrolledIds = new Set(classes.value.map(c => c.id))
    browseClasses.value = (res.data.data?.items || []).filter(c => !enrolledIds.has(c.id))
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load available classes.'))
  } finally {
    browseLoading.value = false
  }
}

async function requestEnroll(klass) {
  requestingId.value = klass.id
  try {
    await ClassesAPI.requestEnrollment(klass.id)
    toast.success(`Enrollment requested for ${klass.name}. Check "Enrollments" for status.`)
    // Reload to update the list
    await loadDashboard()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not request enrollment.'))
  } finally {
    requestingId.value = null
  }
}

const filtered = computed(() => {
  if (!search.value.trim()) return classes.value
  const q = search.value.toLowerCase()
  return classes.value.filter(c =>
    (c.name || '').toLowerCase().includes(q) ||
    (c.courseCode || '').toLowerCase().includes(q) ||
    (c.teacherName || '').toLowerCase().includes(q)
  )
})

onMounted(loadDashboard)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ auth.isStudent ? 'Your classes' : (auth.isTeacher ? 'Classes you teach' : 'All classes') }}</h1>
        <p class="page-subtitle">Signed in as {{ auth.user?.name }} · {{ auth.role }}</p>
      </div>
      <div class="page-actions">
        <input v-model="search" class="search-input" type="search" placeholder="Search classes" />
        <button v-if="auth.isStudent" class="btn btn-primary" @click="openBrowse">Join a class</button>
        <router-link v-if="auth.isAdmin" to="/admin/classes" class="btn btn-primary">Manage classes</router-link>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="filtered.length === 0"
      :title="auth.isStudent ? 'No classes yet' : 'No classes to show'"
      :message="auth.isStudent ? 'Join a class to see it here.' : 'Classes will appear once they exist.'"
    >
      <button v-if="auth.isStudent" class="btn btn-primary" style="margin-top:12px" @click="openBrowse">Join a class</button>
    </EmptyState>

    <div v-else class="class-grid">
      <ClassCard v-for="c in filtered" :key="c.id" :klass="c" />
    </div>

    <Modal v-if="browseModalOpen" title="Join a class" @close="browseModalOpen = false">
      <LoadingSpinner v-if="browseLoading" />
      <EmptyState v-else-if="browseClasses.length === 0" title="No classes available" message="You're already enrolled in everything open right now." />
      <ul v-else class="browse-list">
        <li v-for="c in browseClasses" :key="c.id" class="browse-item">
          <div>
            <div class="browse-title">{{ c.courseCode }} — {{ c.name }}</div>
            <div class="browse-meta">{{ c.teacherName || 'Unassigned teacher' }} · {{ c.dayOfWeek }} {{ c.startTime }}–{{ c.endTime }} · {{ c.enrolledCount ?? 0 }}/{{ c.capacity }} seats</div>
          </div>
          <button
            class="btn btn-outline"
            :disabled="requestingId === c.id || c.status !== 'Open'"
            @click="requestEnroll(c)"
          >
            {{ c.status !== 'Open' ? c.status : (requestingId === c.id ? 'Requesting…' : 'Request') }}
          </button>
        </li>
      </ul>
    </Modal>
  </div>
</template>

<style scoped>
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
}
.page-header h1 { font-family: 'Google Sans', Roboto, sans-serif; font-size: 26px; margin: 0 0 4px; font-weight: 500; }
.page-subtitle { color: var(--gc-text-secondary); font-size: 14px; margin: 0; }
.page-actions { display: flex; gap: 10px; align-items: center; }
.search-input {
  border: 1px solid var(--gc-border); border-radius: 20px;
  padding: 8px 16px; font-size: 14px; width: 220px; outline: none;
}
.search-input:focus { border-color: var(--gc-blue); }
.class-grid {
  display: grid; gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.browse-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.browse-item {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px; border: 1px solid var(--gc-border); border-radius: 8px;
}
.browse-title { font-weight: 500; font-size: 14px; }
.browse-meta { font-size: 12px; color: var(--gc-text-secondary); margin-top: 2px; }
</style>