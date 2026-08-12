<script setup>
import { ref, onMounted, watch } from 'vue'
import { useToastStore } from '@/stores/toast'
import { UsersAPI } from '@/services/api'
import { apiMessage } from '@/services/http'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import Modal from '@/components/Modal.vue'

const toast = useToastStore()
const users = ref([])
const loading = ref(true)
const roleFilter = ref('')

const modalOpen = ref(false)
const saving = ref(false)
const formError = ref('')
const form = ref({ name: '', email: '', password: '', role: 'Teacher' })
const actingId = ref(null)

async function load() {
  loading.value = true
  try {
    const res = await UsersAPI.list({ pageNumber: 1, pageSize: 100, role: roleFilter.value || undefined })
    users.value = res.data.data?.items || []
  } catch (e) {
    toast.error(apiMessage(e, 'Could not load users.'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  formError.value = ''
  form.value = { name: '', email: '', password: '', role: 'Teacher' }
  modalOpen.value = true
}

async function save() {
  formError.value = ''
  if (!form.value.name || !form.value.email || !form.value.password) {
    formError.value = 'Name, email, and password are required.'
    return
  }
  saving.value = true
  try {
    await UsersAPI.create(form.value)
    toast.success('User created.')
    modalOpen.value = false
    load()
  } catch (e) {
    formError.value = apiMessage(e, 'Could not create this user.')
  } finally {
    saving.value = false
  }
}

async function toggleActive(u) {
  actingId.value = u.id
  try {
    if (u.isActive) {
      await UsersAPI.deactivate(u.id)
      toast.success(`${u.name} deactivated.`)
    } else {
      await UsersAPI.activate(u.id)
      toast.success(`${u.name} activated.`)
    }
    load()
  } catch (e) {
    toast.error(apiMessage(e, 'Could not update this user.'))
  } finally {
    actingId.value = null
  }
}

watch(roleFilter, load)
onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Users</h1>
      <div class="page-actions">
        <select v-model="roleFilter" class="role-select">
          <option value="">All roles</option>
          <option value="Admin">Admin</option>
          <option value="Teacher">Teacher</option>
          <option value="Student">Student</option>
        </select>
        <button class="btn btn-primary" @click="openCreate">+ New user</button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="users.length === 0" title="No users found" message="Try a different role filter or create a user." />

    <table v-else class="data-table">
      <thead>
        <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td><span class="chip" style="background:#e8f0fe;color:#1a73e8;">{{ u.role }}</span></td>
          <td>
            <span class="chip" :class="u.isActive ? 'chip-open' : 'chip-closed'">{{ u.isActive ? 'Active' : 'Inactive' }}</span>
          </td>
          <td>
            <button class="btn btn-text" :disabled="actingId === u.id" @click="toggleActive(u)">
              {{ u.isActive ? 'Deactivate' : 'Activate' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <Modal v-if="modalOpen" title="New user" @close="modalOpen = false">
      <form @submit.prevent="save">
        <div class="field">
          <label for="name">Name</label>
          <input id="name" v-model="form.name" type="text" placeholder="Prof. Rahman" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" type="email" placeholder="rahman@example.com" />
        </div>
        <div class="field">
          <label for="password">Temporary password</label>
          <input id="password" v-model="form.password" type="password" placeholder="Passw0rd!" />
        </div>
        <div class="field">
          <label for="role">Role</label>
          <select id="role" v-model="form.role">
            <option value="Admin">Admin</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
          </select>
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
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.page-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 26px; font-weight: 500; margin: 0; }
.page-actions { display: flex; gap: 10px; }
.role-select { border: 1px solid var(--gc-border); border-radius: 4px; padding: 8px 12px; font-size: 14px; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid var(--gc-border); border-radius: 8px; overflow: hidden; font-size: 14px; }
.data-table th { text-align: left; padding: 12px 16px; background: var(--gc-bg); color: var(--gc-text-secondary); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
.data-table td { padding: 12px 16px; border-top: 1px solid var(--gc-border); }
</style>
