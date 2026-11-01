/**
 * Tasks / To-Do Module
 * 3-tier emergency categorization, urgency suggestion engine, CRUD
 */

import { api } from './api.js';
import { state } from './state.js';
import { getIcon } from './icons.js';
import { calculateUrgencySuggestion, formatCountdown } from './urgency.js';
import { showConfirmModal } from './confirm.js';

let editingTaskId = null;

export async function loadTasks() {
  try {
    const scope = state.getBackendScope();
    const tasks = await api.tasks.list(scope ? { scope } : {});
    state.tasks = tasks;
    renderTasks();
    state.emit('tasksUpdated', tasks);
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
}

export function renderTasks() {
  const container = document.getElementById('tasks-view-content');
  if (!container) return;

  const tasks = state.tasks || [];
  
  const highTasks = tasks.filter(t => t.urgency === 'HIGH');
  const mediumTasks = tasks.filter(t => t.urgency === 'MEDIUM');
  const lowTasks = tasks.filter(t => t.urgency === 'LOW');

  container.innerHTML = `
    <div class="todo-toolbar">
      <div class="tabs-container">
        <button class="tab-btn active" data-task-filter="all">All (${tasks.length})</button>
        <button class="tab-btn" data-task-filter="pending">Pending (${tasks.filter(t => !t.completed).length})</button>
        <button class="tab-btn" data-task-filter="completed">Completed (${tasks.filter(t => t.completed).length})</button>
      </div>
      <div class="todo-actions-right">
        <button class="btn btn-primary" id="btn-open-add-task">
          ${getIcon('plus')} Add Task
        </button>
      </div>
    </div>

    <div class="todo-columns">
      <!-- High Urgency Column -->
      <div class="todo-column" data-urgency="HIGH">
        <div class="todo-column-header">
          <div class="todo-column-title-group">
            <span class="todo-column-indicator indicator-high"></span>
            <h3 class="todo-column-title">High Urgency</h3>
          </div>
          <span class="todo-column-count">${highTasks.length}</span>
        </div>
        <div class="task-list" id="task-list-high">
          ${renderTaskList(highTasks)}
        </div>
      </div>

      <!-- Medium Urgency Column -->
      <div class="todo-column" data-urgency="MEDIUM">
        <div class="todo-column-header">
          <div class="todo-column-title-group">
            <span class="todo-column-indicator indicator-medium"></span>
            <h3 class="todo-column-title">Medium Urgency</h3>
          </div>
          <span class="todo-column-count">${mediumTasks.length}</span>
        </div>
        <div class="task-list" id="task-list-medium">
          ${renderTaskList(mediumTasks)}
        </div>
      </div>

      <!-- Low Urgency Column -->
      <div class="todo-column" data-urgency="LOW">
        <div class="todo-column-header">
          <div class="todo-column-title-group">
            <span class="todo-column-indicator indicator-low"></span>
            <h3 class="todo-column-title">Low Urgency</h3>
          </div>
          <span class="todo-column-count">${lowTasks.length}</span>
        </div>
        <div class="task-list" id="task-list-low">
          ${renderTaskList(lowTasks)}
        </div>
      </div>
    </div>
  `;

  attachTaskEventListeners();
}

function renderTaskList(taskList) {
  if (taskList.length === 0) {
    return `
      <div class="empty-state" style="padding: 24px 10px;">
        <p class="empty-state-text">No tasks in this category</p>
      </div>
    `;
  }

  return taskList.map(task => {
    const countdown = task.due_date ? formatCountdown(task.due_date) : null;
    return `
      <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="task-card-main">
          <label class="custom-checkbox">
            <input type="checkbox" class="task-toggle" ${task.completed ? 'checked' : ''}>
            <span class="checkmark"></span>
          </label>
          <div class="task-card-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
              <span class="badge ${task.scope === 'uni' ? 'badge-uni' : 'badge-personal'}">
                ${task.scope === 'uni' ? 'Uni' : 'Personal'}
              </span>
              ${countdown ? `
                <span class="task-date-badge ${countdown.isUrgent ? 'overdue' : ''}">
                  ${getIcon('calendar', 'icon-sm')} ${countdown.text}
                </span>
              ` : ''}
            </div>
          </div>
          <div class="task-card-actions">
            <button class="btn btn-ghost btn-icon-sm btn-edit-task" title="Edit task">
              ${getIcon('edit')}
            </button>
            <button class="btn btn-ghost btn-icon-sm btn-delete-task" title="Delete task">
              ${getIcon('trash')}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function attachTaskEventListeners() {
  // Add task button
  const addBtn = document.getElementById('btn-open-add-task');
  if (addBtn) {
    addBtn.addEventListener('click', () => openTaskModal());
  }

  // Filter tabs
  const filterBtns = document.querySelectorAll('[data-task-filter]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.taskFilter;
      applyTaskFilter(filter);
    });
  });

  // Checkbox toggle
  document.querySelectorAll('.task-toggle').forEach(input => {
    input.addEventListener('change', async (e) => {
      const card = e.target.closest('.task-card');
      const taskId = Number(card.dataset.taskId);
      const isCompleted = e.target.checked;
      try {
        await api.tasks.update(taskId, { completed: isCompleted });
        const task = state.tasks.find(t => t.id === taskId);
        if (task) task.completed = isCompleted;
        renderTasks();
        state.emit('tasksUpdated', state.tasks);
      } catch (err) {
        console.error('Failed to update task:', err);
        e.target.checked = !isCompleted;
      }
    });
  });

  // Edit task
  document.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.task-card');
      const taskId = Number(card.dataset.taskId);
      const task = state.tasks.find(t => t.id === taskId);
      if (task) openTaskModal(task);
    });
  });

  // Delete task
  document.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const card = e.target.closest('.task-card');
      const taskId = Number(card.dataset.taskId);
      const confirmed = await showConfirmModal({
        title: 'Delete Task',
        message: 'Are you sure you want to delete it?'
      });
      if (confirmed) {
        try {
          await api.tasks.delete(taskId);
          state.tasks = state.tasks.filter(t => t.id !== taskId);
          renderTasks();
          state.emit('tasksUpdated', state.tasks);
        } catch (err) {
          console.error('Failed to delete task:', err);
        }
      }
    });
  });
}

function applyTaskFilter(filter) {
  const cards = document.querySelectorAll('.task-card');
  cards.forEach(card => {
    const isCompleted = card.classList.contains('completed');
    if (filter === 'all') {
      card.style.display = 'flex';
    } else if (filter === 'pending') {
      card.style.display = isCompleted ? 'none' : 'flex';
    } else if (filter === 'completed') {
      card.style.display = isCompleted ? 'flex' : 'none';
    }
  });
}

/**
 * Open Modal to Add or Edit Task
 */
export function openTaskModal(task = null) {
  editingTaskId = task ? task.id : null;
  const modal = document.getElementById('task-modal');
  if (!modal) return;

  const titleEl = document.getElementById('task-modal-title');
  const form = document.getElementById('task-form');

  if (titleEl) titleEl.textContent = task ? 'Edit Task' : 'Add New Task';

  form.elements['title'].value = task ? task.title : '';
  form.elements['description'].value = task && task.description ? task.description : '';
  form.elements['due_date'].value = task && task.due_date ? task.due_date : '';
  form.elements['scope'].value = task ? task.scope : (state.getBackendScope() || 'uni');
  form.elements['urgency'].value = task ? task.urgency : 'MEDIUM';

  updateModalUrgencySuggestion();

  modal.classList.add('open');
}

export function closeTaskModal() {
  const modal = document.getElementById('task-modal');
  if (modal) modal.classList.remove('open');
  editingTaskId = null;
}

export function updateModalUrgencySuggestion() {
  const dueDateInput = document.getElementById('task-due-date');
  const suggestionBox = document.getElementById('urgency-suggestion');
  if (!dueDateInput || !suggestionBox) return;

  const dueDate = dueDateInput.value;
  const suggestion = calculateUrgencySuggestion(dueDate);

  suggestionBox.innerHTML = `
    <div class="urgency-suggestion-text">
      ${getIcon('sparkles')} <strong>Engine Suggestion:</strong> ${suggestion.urgency} (${suggestion.reason})
    </div>
    <button type="button" class="btn btn-subtle btn-sm" id="btn-apply-urgency" data-suggested="${suggestion.urgency}">
      Apply
    </button>
  `;

  const applyBtn = document.getElementById('btn-apply-urgency');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const urgencySelect = document.getElementById('task-urgency');
      if (urgencySelect) {
        urgencySelect.value = suggestion.urgency;
      }
    });
  }
}

export function initTaskForm() {
  const form = document.getElementById('task-form');
  if (!form) return;

  const dueDateInput = document.getElementById('task-due-date');
  if (dueDateInput) {
    dueDateInput.addEventListener('change', () => updateModalUrgencySuggestion());
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      title: form.elements['title'].value.trim(),
      description: form.elements['description'].value.trim() || null,
      due_date: form.elements['due_date'].value || null,
      scope: form.elements['scope'].value,
      urgency: form.elements['urgency'].value,
    };

    if (!data.title) return;

    try {
      if (editingTaskId) {
        await api.tasks.update(editingTaskId, data);
      } else {
        await api.tasks.create(data);
      }
      closeTaskModal();
      await loadTasks();
    } catch (err) {
      alert(`Error saving task: ${err.message}`);
    }
  });

  const cancelBtn = document.getElementById('btn-cancel-task');
  if (cancelBtn) cancelBtn.addEventListener('click', closeTaskModal);

  const closeBtn = document.getElementById('btn-close-task-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeTaskModal);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
