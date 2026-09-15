/**
 * Deadlines Module
 * Categorizes deadlines into Upcoming, In Progress, Completed, and Overall List.
 * Course association, countdown calculations, and full CRUD.
 */

import { api } from './api.js';
import { state } from './state.js';
import { getIcon } from './icons.js';
import { formatCountdown } from './urgency.js';

let editingDeadlineId = null;
let currentTab = 'upcoming'; // 'upcoming' | 'in_progress' | 'completed' | 'list'
let selectedTypeFilter = 'all'; // 'all' | 'assignment' | 'exam'
let selectedCourseFilter = 'all';
let deadlinesDisplayMode = localStorage.getItem('studypulse_deadlines_display') || 'list';

function getDeadlineStatus(deadline) {
  const saved = localStorage.getItem(`studypulse_deadline_${deadline.id}_status`);
  if (saved) return saved;

  if (!deadline.due_date) return 'upcoming';
  const countdown = formatCountdown(deadline.due_date);
  if (countdown.diffDays <= 3) {
    return 'in_progress';
  }
  return 'upcoming';
}

function setDeadlineStatus(deadlineId, status) {
  localStorage.setItem(`studypulse_deadline_${deadlineId}_status`, status);
  renderDeadlines();
  state.emit('deadlinesUpdated', state.deadlines);
}

export async function loadDeadlines() {
  try {
    const scope = state.getBackendScope();
    const params = {};
    if (scope) params.scope = scope;
    if (selectedTypeFilter !== 'all') params.type = selectedTypeFilter;
    if (selectedCourseFilter !== 'all') params.course_id = Number(selectedCourseFilter);

    const deadlines = await api.deadlines.list(params);
    state.deadlines = deadlines;
    renderDeadlines();
    state.emit('deadlinesUpdated', deadlines);
  } catch (err) {
    console.error('Failed to load deadlines:', err);
  }
}

export function renderDeadlines() {
  const container = document.getElementById('deadlines-view-content');
  if (!container) return;

  const allDeadlines = state.deadlines || [];
  
  // Categorize
  const categorized = allDeadlines.map(d => ({
    ...d,
    status: getDeadlineStatus(d)
  }));

  const upcomingList = categorized.filter(d => d.status === 'upcoming');
  const inProgressList = categorized.filter(d => d.status === 'in_progress');
  const completedList = categorized.filter(d => d.status === 'completed');

  // Populate course filter options
  const courseOptions = state.courses.map(c => `
    <option value="${c.id}" ${String(selectedCourseFilter) === String(c.id) ? 'selected' : ''}>
      ${escapeHtml(c.title)} ${c.code ? `(${escapeHtml(c.code)})` : ''}
    </option>
  `).join('');

  container.innerHTML = `
    <div class="deadlines-toolbar">
      <div class="tabs-container">
        <button class="tab-btn ${currentTab === 'upcoming' ? 'active' : ''}" data-deadline-tab="upcoming">
          Upcoming (${upcomingList.length})
        </button>
        <button class="tab-btn ${currentTab === 'in_progress' ? 'active' : ''}" data-deadline-tab="in_progress">
          In Progress (${inProgressList.length})
        </button>
        <button class="tab-btn ${currentTab === 'completed' ? 'active' : ''}" data-deadline-tab="completed">
          Completed (${completedList.length})
        </button>
        <button class="tab-btn ${currentTab === 'list' ? 'active' : ''}" data-deadline-tab="list">
          All Deadlines (${categorized.length})
        </button>
      </div>

      <div class="deadlines-filters">
        <!-- View Mode Switcher -->
        <div class="tabs-container">
          <button class="tab-btn ${deadlinesDisplayMode === 'list' ? 'active' : ''}" id="btn-toggle-deadlines-list" title="Table List View">
            ${getIcon('tasks', 'icon-sm')} List
          </button>
          <button class="tab-btn ${deadlinesDisplayMode === 'cards' ? 'active' : ''}" id="btn-toggle-deadlines-cards" title="Cards View">
            ${getIcon('dashboard', 'icon-sm')} Cards
          </button>
        </div>

        <select class="form-control" id="deadline-type-filter" style="width: auto;">
          <option value="all" ${selectedTypeFilter === 'all' ? 'selected' : ''}>All Types</option>
          <option value="assignment" ${selectedTypeFilter === 'assignment' ? 'selected' : ''}>Assignments</option>
          <option value="exam" ${selectedTypeFilter === 'exam' ? 'selected' : ''}>Exams</option>
        </select>

        <select class="form-control" id="deadline-course-filter" style="width: auto;">
          <option value="all">All Courses</option>
          ${courseOptions}
        </select>

        <button class="btn btn-primary" id="btn-open-add-deadline">
          ${getIcon('plus')} Add Deadline
        </button>
      </div>
    </div>

    <div id="deadlines-content-container">
      ${renderActiveTabContent(categorized, upcomingList, inProgressList, completedList)}
    </div>
  `;

  attachDeadlineEvents();
}

function renderActiveTabContent(categorized, upcoming, inProgress, completed) {
  let list = [];
  if (currentTab === 'upcoming') list = upcoming;
  else if (currentTab === 'in_progress') list = inProgress;
  else if (currentTab === 'completed') list = completed;
  else list = categorized;

  if (list.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${getIcon('deadline')}</div>
        <h4 class="empty-state-title">No deadlines found</h4>
        <p class="empty-state-text">You have no deadlines in this view.</p>
        <button class="btn btn-primary" id="btn-empty-add-deadline">
          ${getIcon('plus')} Create Deadline
        </button>
      </div>
    `;
  }

  if (deadlinesDisplayMode === 'list') {
    return renderDeadlinesTable(list);
  }

  return `
    <div class="deadlines-grid">
      ${list.map(d => renderDeadlineCard(d)).join('')}
    </div>
  `;
}

function renderDeadlinesTable(list) {
  return `
    <div class="deadlines-table-card">
      <table class="deadlines-table">
        <thead>
          <tr>
            <th style="width: 110px;">Status</th>
            <th>Deadline Title</th>
            <th>Course</th>
            <th>Type</th>
            <th>Due Date</th>
            <th>Time Remaining</th>
            <th>Scope</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(d => {
            const course = d.course_id ? state.getCourseById(d.course_id) : null;
            const countdown = d.due_date ? formatCountdown(d.due_date) : null;
            return `
              <tr class="${d.status === 'completed' ? 'completed' : ''}" data-deadline-id="${d.id}">
                <td>
                  <div class="status-pill-toggle">
                    <button class="status-pill-option ${d.status === 'upcoming' ? 'active' : ''}" data-set-status="upcoming" title="Mark Upcoming">Up</button>
                    <button class="status-pill-option ${d.status === 'in_progress' ? 'active' : ''}" data-set-status="in_progress" title="Mark In Progress">Prog</button>
                    <button class="status-pill-option ${d.status === 'completed' ? 'active' : ''}" data-set-status="completed" title="Mark Completed">Done</button>
                  </div>
                </td>
                <td>
                  <div class="deadline-title-cell">${escapeHtml(d.title)}</div>
                </td>
                <td>
                  ${course ? `
                    <div class="deadline-course-tag" style="margin: 0;">
                      ${escapeHtml(course.title)} ${course.code ? `(${escapeHtml(course.code)})` : ''}
                    </div>
                  ` : '<span style="color: var(--text-muted);">—</span>'}
                </td>
                <td>
                  <span class="badge ${d.type === 'exam' ? 'badge-exam' : 'badge-assignment'}">
                    ${d.type}
                  </span>
                </td>
                <td>
                  <span style="font-weight: 600;">${d.due_date || '—'}</span>
                </td>
                <td>
                  ${countdown ? `
                    <span class="deadline-countdown-badge ${countdown.isUrgent ? 'countdown-urgent' : 'countdown-normal'}">
                      ${countdown.text}
                    </span>
                  ` : '<span style="color: var(--text-muted);">—</span>'}
                </td>
                <td>
                  <span class="badge ${d.scope === 'uni' ? 'badge-uni' : 'badge-personal'}">
                    ${d.scope === 'uni' ? 'Uni' : 'Personal'}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="deadline-actions" style="justify-content: flex-end;">
                    <button class="btn btn-ghost btn-icon-sm btn-edit-deadline" title="Edit deadline">
                      ${getIcon('edit')}
                    </button>
                    <button class="btn btn-ghost btn-icon-sm btn-delete-deadline" title="Delete deadline">
                      ${getIcon('trash')}
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderDeadlineCard(d) {
  const course = d.course_id ? state.getCourseById(d.course_id) : null;
  const countdown = d.due_date ? formatCountdown(d.due_date) : null;

  return `
    <div class="deadline-card ${d.status === 'completed' ? 'completed' : ''}" data-deadline-id="${d.id}">
      <div class="deadline-card-header">
        <div class="deadline-badges">
          <span class="badge ${d.type === 'exam' ? 'badge-exam' : 'badge-assignment'}">
            ${d.type}
          </span>
          <span class="badge ${d.scope === 'uni' ? 'badge-uni' : 'badge-personal'}">
            ${d.scope === 'uni' ? 'Uni' : 'Personal'}
          </span>
        </div>

        <div class="status-pill-toggle">
          <button class="status-pill-option ${d.status === 'upcoming' ? 'active' : ''}" data-set-status="upcoming" title="Mark Upcoming">
            Up
          </button>
          <button class="status-pill-option ${d.status === 'in_progress' ? 'active' : ''}" data-set-status="in_progress" title="Mark In Progress">
            Prog
          </button>
          <button class="status-pill-option ${d.status === 'completed' ? 'active' : ''}" data-set-status="completed" title="Mark Completed">
            Done
          </button>
        </div>
      </div>

      <div class="deadline-title">${escapeHtml(d.title)}</div>

      ${course ? `
        <div class="deadline-course-tag">
          ${getIcon('courses', 'icon-sm')} ${escapeHtml(course.title)} ${course.code ? `(${escapeHtml(course.code)})` : ''}
        </div>
      ` : ''}

      <div class="deadline-footer">
        ${countdown ? `
          <span class="deadline-countdown-badge ${countdown.isUrgent ? 'countdown-urgent' : 'countdown-normal'}">
            ${getIcon('clock', 'icon-sm')} ${countdown.text} (${d.due_date})
          </span>
        ` : `<span class="deadline-countdown-badge countdown-normal">No due date</span>`}

        <div class="deadline-actions">
          <button class="btn btn-ghost btn-icon-sm btn-edit-deadline" title="Edit deadline">
            ${getIcon('edit')}
          </button>
          <button class="btn btn-ghost btn-icon-sm btn-delete-deadline" title="Delete deadline">
            ${getIcon('trash')}
          </button>
        </div>
      </div>
    </div>
  `;
}

function attachDeadlineEvents() {
  // View mode switcher
  document.getElementById('btn-toggle-deadlines-list')?.addEventListener('click', () => {
    deadlinesDisplayMode = 'list';
    localStorage.setItem('studypulse_deadlines_display', 'list');
    renderDeadlines();
  });

  document.getElementById('btn-toggle-deadlines-cards')?.addEventListener('click', () => {
    deadlinesDisplayMode = 'cards';
    localStorage.setItem('studypulse_deadlines_display', 'cards');
    renderDeadlines();
  });

  // Add deadline buttons
  ['btn-open-add-deadline', 'btn-empty-add-deadline'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => openDeadlineModal());
  });

  // Tab switching
  document.querySelectorAll('[data-deadline-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.deadlineTab;
      renderDeadlines();
    });
  });

  // Type filter
  const typeFilter = document.getElementById('deadline-type-filter');
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      selectedTypeFilter = e.target.value;
      loadDeadlines();
    });
  }

  // Course filter
  const courseFilter = document.getElementById('deadline-course-filter');
  if (courseFilter) {
    courseFilter.addEventListener('change', (e) => {
      selectedCourseFilter = e.target.value;
      loadDeadlines();
    });
  }

  // Status pills (support both cards and table rows)
  document.querySelectorAll('[data-set-status]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const el = e.target.closest('[data-deadline-id]');
      if (!el) return;
      const deadlineId = Number(el.dataset.deadlineId);
      const status = e.target.dataset.setStatus;
      setDeadlineStatus(deadlineId, status);
    });
  });

  // Edit deadline (support both cards and table rows)
  document.querySelectorAll('.btn-edit-deadline').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const el = e.target.closest('[data-deadline-id]');
      if (!el) return;
      const deadlineId = Number(el.dataset.deadlineId);
      const deadline = state.deadlines.find(d => d.id === deadlineId);
      if (deadline) openDeadlineModal(deadline);
    });
  });

  // Delete deadline (support both cards and table rows)
  document.querySelectorAll('.btn-delete-deadline').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const el = e.target.closest('[data-deadline-id]');
      if (!el) return;
      const deadlineId = Number(el.dataset.deadlineId);
      if (confirm('Delete this deadline?')) {
        try {
          await api.deadlines.delete(deadlineId);
          state.deadlines = state.deadlines.filter(d => d.id !== deadlineId);
          renderDeadlines();
          state.emit('deadlinesUpdated', state.deadlines);
        } catch (err) {
          alert(`Failed to delete deadline: ${err.message}`);
        }
      }
    });
  });
}

/**
 * Open Modal to Add or Edit Deadline
 */
export function openDeadlineModal(deadline = null, preselectedCourseId = null) {
  editingDeadlineId = deadline ? deadline.id : null;
  const modal = document.getElementById('deadline-modal');
  if (!modal) return;

  const titleEl = document.getElementById('deadline-modal-title');
  const form = document.getElementById('deadline-form');

  if (titleEl) titleEl.textContent = deadline ? 'Edit Deadline' : 'Add New Deadline';

  // Populate course options
  const courseSelect = form.elements['course_id'];
  courseSelect.innerHTML = `
    <option value="">-- No Course Selected --</option>
    ${state.courses.map(c => `
      <option value="${c.id}">${escapeHtml(c.title)} ${c.code ? `(${escapeHtml(c.code)})` : ''}</option>
    `).join('')}
  `;

  form.elements['title'].value = deadline ? deadline.title : '';
  form.elements['type'].value = deadline ? deadline.type : 'assignment';
  form.elements['course_id'].value = deadline && deadline.course_id ? deadline.course_id : (preselectedCourseId || '');
  form.elements['due_date'].value = deadline && deadline.due_date ? deadline.due_date : '';
  form.elements['scope'].value = deadline ? deadline.scope : (state.getBackendScope() || 'uni');

  modal.classList.add('open');
}

export function closeDeadlineModal() {
  const modal = document.getElementById('deadline-modal');
  if (modal) modal.classList.remove('open');
  editingDeadlineId = null;
}

export function initDeadlineForm() {
  const form = document.getElementById('deadline-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseVal = form.elements['course_id'].value;
    const data = {
      title: form.elements['title'].value.trim(),
      type: form.elements['type'].value,
      course_id: courseVal ? Number(courseVal) : null,
      due_date: form.elements['due_date'].value || null,
      scope: form.elements['scope'].value,
    };

    if (!data.title) return;

    try {
      if (editingDeadlineId) {
        await api.deadlines.update(editingDeadlineId, data);
      } else {
        await api.deadlines.create(data);
      }
      closeDeadlineModal();
      await loadDeadlines();
    } catch (err) {
      alert(`Error saving deadline: ${err.message}`);
    }
  });

  const cancelBtn = document.getElementById('btn-cancel-deadline');
  if (cancelBtn) cancelBtn.addEventListener('click', closeDeadlineModal);

  const closeBtn = document.getElementById('btn-close-deadline-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeDeadlineModal);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
