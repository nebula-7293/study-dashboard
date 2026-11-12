/**
 * REST API Client for StudyPulse
 * Seamlessly interfaces with FastAPI backend without backend modifications
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (response.status === 401) {
      window.location.href = '/login.html';
      throw new Error('Session expired. Redirecting to login...');
    }
    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        // Response was not JSON
      }
      throw new Error(errorDetail);
    }
    // Return json if content exists
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${url}]:`, error);
    throw error;
  }
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export const api = {
  // Tasks API
  tasks: {
    list: (filters = {}) => request(`/tasks/${buildQuery(filters)}`),
    get: (id) => request(`/tasks/${id}`),
    create: (data) => request('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  },

  // Deadlines API
  deadlines: {
    list: (filters = {}) => request(`/deadlines/${buildQuery(filters)}`),
    get: (id) => request(`/deadlines/${id}`),
    create: (data) => request('/deadlines/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/deadlines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/deadlines/${id}`, { method: 'DELETE' }),
  },

  // Courses API
  courses: {
    list: (filters = {}) => request(`/courses/${buildQuery(filters)}`),
    get: (id) => request(`/courses/${id}`),
    getGpa: (filters = {}) => request(`/courses/gpa${buildQuery(filters)}`),
    create: (data) => request('/courses/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  },

  // Schedules API
  schedules: {
    list: (filters = {}) => request(`/schedules/${buildQuery(filters)}`),
    get: (id) => request(`/schedules/${id}`),
    create: (data) => request('/schedules/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),
  },

  // Auth API
  auth: {
    me: () => request('/auth/me'),
    updateMe: (data) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },

  // Pomodoro API
  pomodoro: {
    list: (filters = {}) => request(`/pomodoros/${buildQuery(filters)}`),
    create: (data) => request('/pomodoros/', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/pomodoros/${id}`, { method: 'DELETE' }),
  },
};