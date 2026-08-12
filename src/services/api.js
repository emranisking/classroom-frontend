import { http } from './http'

// ---- Auth ----
export const AuthAPI = {
  register: (payload) => http.post('/auth/register', payload),
  login: (payload) => http.post('/auth/login', payload),
  me: () => http.get('/auth/me')
}

// ---- Users (Admin) ----
export const UsersAPI = {
  list: (params) => http.get('/users', { params }),
  get: (id) => http.get(`/users/${id}`),
  create: (payload) => http.post('/users', payload),
  update: (id, payload) => http.put(`/users/${id}`, payload),
  activate: (id) => http.patch(`/users/${id}/activate`),
  deactivate: (id) => http.patch(`/users/${id}/deactivate`)
}

// ---- Courses ----
export const CoursesAPI = {
  list: (params) => http.get('/courses', { params }),
  get: (id) => http.get(`/courses/${id}`),
  create: (payload) => http.post('/courses', payload),
  update: (id, payload) => http.put(`/courses/${id}`, payload),
  remove: (id) => http.delete(`/courses/${id}`)
}

// ---- Classes ----
export const ClassesAPI = {
  list: (params) => http.get('/classes', { params }),
  get: (id) => http.get(`/classes/${id}`),
  create: (payload) => http.post('/classes', payload),
  update: (id, payload) => http.put(`/classes/${id}`, payload),
  assignTeacher: (id, teacherId) => http.patch(`/classes/${id}/assign-teacher`, { teacherId }),
  setStatus: (id, status) => http.patch(`/classes/${id}/status`, { status }),
  roster: (id) => http.get(`/classes/${id}/students`),
  assignments: (classId, params) => http.get(`/classes/${classId}/assignments`, { params }),
  createAssignment: (classId, payload) => http.post(`/classes/${classId}/assignments`, payload),
  requestEnrollment: (classId) => http.post(`/classes/${classId}/enrollment-requests`),
  results: (classId) => http.get(`/classes/${classId}/results`)
}

// ---- Enrollments ----
export const EnrollmentsAPI = {
  requestStatus: (requestId) => http.get(`/enrollment-requests/${requestId}`),
  myRequests: (params) => http.get('/enrollment-requests', { params }),
  myEnrollments: () => http.get('/enrollments/me'),
  drop: (enrollmentId) => http.delete(`/enrollments/${enrollmentId}`)
}

// ---- Teacher Applications ----
export const TeacherApplicationsAPI = {
  apply: (courseId) => http.post('/teacher-applications', { courseId }),
  list: (params) => http.get('/teacher-applications', { params }),
  get: (id) => http.get(`/teacher-applications/${id}`),
  approve: (id, note) => http.patch(`/teacher-applications/${id}/approve`, { note }),
  reject: (id, note) => http.patch(`/teacher-applications/${id}/reject`, { note })
}

// ---- Assignments ----
export const AssignmentsAPI = {
  get: (id) => http.get(`/assignments/${id}`),
  update: (id, payload) => http.put(`/assignments/${id}`, payload),
  publish: (id) => http.patch(`/assignments/${id}/publish`),
  publishResults: (id) => http.patch(`/assignments/${id}/publish-results`),
  remove: (id) => http.delete(`/assignments/${id}`),
  submissions: (assignmentId, params) => http.get(`/assignments/${assignmentId}/submissions`, { params }),
  submit: (assignmentId, file, onUploadProgress) => {
    const form = new FormData()
    form.append('file', file)
    return http.post(`/assignments/${assignmentId}/submissions`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    })
  }
}

// ---- Submissions ----
export const SubmissionsAPI = {
  get: (id) => http.get(`/submissions/${id}`),
  versions: (id) => http.get(`/submissions/${id}/versions`),
  downloadUrl: (id, version) => {
    const base = (import.meta.env.VITE_API_BASE_URL || '/api')
    return `${base}/submissions/${id}/download${version ? `?version=${version}` : ''}`
  },
  uploadVersion: (id, file, onUploadProgress) => {
    const form = new FormData()
    form.append('file', file)
    return http.post(`/submissions/${id}/versions`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    })
  },
  grade: (id, payload) => http.post(`/submissions/${id}/grade`, payload),
  requestResubmission: (id, reason) => http.post(`/submissions/${id}/resubmission-requests`, { reason })
}

// ---- Resubmissions ----
export const ResubmissionsAPI = {
  list: (params) => http.get('/resubmission-requests', { params }),
  approve: (id, note) => http.patch(`/resubmission-requests/${id}/approve`, { note }),
  reject: (id, note) => http.patch(`/resubmission-requests/${id}/reject`, { note })
}

// ---- Results ----
export const ResultsAPI = {
  me: () => http.get('/results/me')
}
