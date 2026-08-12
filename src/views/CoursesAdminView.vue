<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import { CoursesAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import Modal from '@/components/Modal.vue'

const toast = useToastStore()
const courses = ref([])
const loading = ref(true)
const search = ref('')

const modalOpen = ref(false)
const editingId = ref(null)
const form = ref({ code: '', name: '', description: '', creditHours: 3 })
const saving = ref(false)
const formError = ref('')

async function load() {
  loading.value = true
  try {
    const res = await CoursesAPI.list({ pageNumber: 1, pageSize: 100, search: search.value || undefined })
    courses.value = res.data.data?.items || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load courses.'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { code: '', name: '', description: '', creditHours: 3 }
  formError.value = ''
  modalOpen.value = true
}

function openEdit(c) {
  editingId.value = c.id
  form.value = { code: c.code, name: c.name, description: c.description || '', creditHours: c.creditHours }
  formError.value = ''
  modalOpen.value = true
}

async function save() {
  formError.value = ''
  if (!form.value.code || !form.value.name || !form.value.creditHours) {
    formError.value = 'Code, name, and credit hours are required.'
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await CoursesAPI.update(editingId.value, {
        name: form.value.name,
        description: form.value.description,
        creditHours: Number(form.value.creditHours)
      })
      toast.success('Course updated.')
    } else {
      await CoursesAPI.create({
        code: form.value.code,
        name: form.value.name,
        description: form.value.description,
        creditHours: Number(form.value.creditHours)
      })
      toast.success('Course created.')
    }
    modalOpen.value = false
    load()
  } catch (e) {
    formError.value = apiMessage(e, 'Could not save this course.')
  } finally {
    saving.value = false
  }
}

async function remove(c) {
  if (!confirm(`Delete course ${c.code}? This cannot be undone.`)) return
  try {
    await CoursesAPI.remove(c.id)
    toast.success('Course deleted.')
    load()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not delete this course.'))
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Courses</h1>
      <div class="page-actions">
        <input v-model="search" class="search-input" type="search" placeholder="Search courses" @keyup.enter="load" />
        <button class="btn btn-primary" @click="openCreate">+ New course</button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="courses.length === 0" title="No courses yet" message="Create your first course to get started." />

    <table v-else class="data-table">
      <thead>
        <tr><th>Code</th><th>Name</th><th>Credit hours</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="c in courses" :key="c.id">
          <td class="mono">{{ c.code }}</td>
          <td>{{ c.name }}</td>
          <td>{{ c.creditHours }}</td>
          <td class="actions-cell">
            <button class="btn btn-text" @click="openEdit(c)">Edit</button>
            <button class="btn btn-text danger-text" @click="remove(c)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <Modal v-if="modalOpen" :title="editingId ? 'Edit course' : 'New course'" @close="modalOpen = false">
      <form @submit.prevent="save">
        <div class="field">
          <label for="code">Course code</label>
          <input id="code" v-model="form.code" type="text" placeholder="CSE110" :disabled="!!editingId" />
        </div>
        <div class="field">
          <label for="name">Name</label>
          <input id="name" v-model="form.name" type="text" placeholder="Intro to Programming" />
        </div>
        <div class="field">
          <label for="desc">Description</label>
          <textarea id="desc" v-model="form.description" rows="3" placeholder="Basics"></textarea>
        </div>
        <div class="field">
          <label for="credits">Credit hours</label>
          <input id="credits" v-model="form.creditHours" type="number" min="1" />
        </div>
        <p v-if="formError" class="field-error">{{ formError }}</p>
      </form>
      <template #footer>
        <button class="btn btn-outline" @click="modalOpen = false">Cancel</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.page-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 26px; font-weight: 500; margin: 0; }
.page-actions { display: flex; gap: 10px; }
.search-input { border: 1px solid var(--gc-border); border-radius: 20px; padding: 8px 16px; font-size: 14px; width: 220px; outline: none; }
.search-input:focus { border-color: var(--gc-blue); }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid var(--gc-border); border-radius: 8px; overflow: hidden; font-size: 14px; }
.data-table th { text-align: left; padding: 12px 16px; background: var(--gc-bg); color: var(--gc-text-secondary); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
.data-table td { padding: 12px 16px; border-top: 1px solid var(--gc-border); }
.mono { font-family: 'Roboto Mono', monospace; }
.actions-cell { display: flex; gap: 4px; }
.danger-text { color: var(--gc-red); }
textarea { font-family: inherit; resize: vertical; }
</style>
