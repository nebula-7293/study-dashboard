/**
 * Main Dashboard View Coordinator
 * Stats widgets, embedded Pomodoro timer, quick to-do list, and today's schedule agenda
 */

import { state } from './state.js';
import { getIcon } from './icons.js';
import { pomodoro } from './pomodoro.js';
import { formatCountdown } from './urgency.js';
import { openTaskModal } from './tasks.js';
import { openScheduleModal, getOccasionsForDateRange, getOccasionColor } from './schedule.js';
import { api } from './api.js';

export function renderDashboard() {
  const container = document.getElementById('dashboard-view-content');
  if (!container) return;

  const tasks = state.tasks || [];
  const completedTasks = tasks.filter(t => t.completed);
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Find closest deadline
  const upcomingDeadlines = (state.deadlines || [])
    .filter(d => d.due_date)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const closestDeadline = upcomingDeadlines[0] || null;
  const closestCountdown = closestDeadline ? formatCountdown(closestDeadline.due_date) : null;
  const closestCourse = closestDeadline && closestDeadline.course_id ? state.getCourseById(closestDeadline.course_id) : null;

  // GPA
  const gpa = state.gpaData || { gpa_average: 0.0, ects_letter: 'N/A' };

  // Today's schedule
  const today = new Date();
  const todayOccasions = getOccasionsForDateRange(today, today);

  container.innerHTML = `
    <!-- Top Stats Row -->
    <div class="bento-grid dashboard-stats-row" style="margin-bottom: 24px;">
      <!-- Stat 1: Tasks Progress -->
      <div class="col-4">
        <div class="stat-card">
          <div class="stat-icon-wrapper lavender">
            ${getIcon('tasks')}
          </div>
          <div class="stat-content">
            <span class="stat-label">Tasks Progress</span>
            <div class="stat-value">
              ${completedTasks.length} <span class="stat-unit">/ ${tasks.length}</span>
            </div>
            <div class="stat-meta-detail">
              <span class="stat-detail-text">${completionPercentage}% completed</span>
            </div>
            <div class="stat-progress-bar">
              <div class="stat-progress-fill" style="width: ${completionPercentage}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stat 2: Next Deadline -->
      <div class="col-4">
        <div class="stat-card">
          <div class="stat-icon-wrapper amber">
            ${getIcon('deadline')}
          </div>
          <div class="stat-content">
            <span class="stat-label">Next Deadline</span>
            <div class="stat-value">
              ${closestCountdown ? closestCountdown.text : (closestDeadline ? closestDeadline.due_date : 'None')}
            </div>
            <div class="stat-meta-detail">
              <span class="stat-detail-text" title="${closestDeadline ? escapeHtml(closestDeadline.title) : 'All clear'}">
                ${closestDeadline ? escapeHtml(closestDeadline.title) : 'All caught up!'}
              </span>
            </div>
            <div class="stat-progress-bar">
              <div class="stat-progress-fill" style="width: ${closestDeadline ? 100 : 0}%; background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stat 3: Academic Standing / GPA -->
      <div class="col-4">
        <div class="stat-card">
          <div class="stat-icon-wrapper emerald">
            ${getIcon('grades')}
          </div>
          <div class="stat-content">
            <span class="stat-label">Current GPA</span>
            <div class="stat-value">
              ${gpa.gpa_average.toFixed(2)} <span class="stat-unit">GPA</span>
            </div>
            <div class="stat-meta-detail">
              <span class="stat-detail-text">Grade: ${gpa.ects_letter} (${gpa.earned_credits || 0} ECTS)</span>
            </div>
            <div class="stat-progress-bar">
              <div class="stat-progress-fill" style="width: ${Math.min(100, Math.round(((gpa.gpa_average || 0) / 4.0) * 100))}%; background: linear-gradient(90deg, #10b981 0%, #34d399 100%);"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Bento Grid Modules -->
    <div class="bento-grid dashboard-main-row" style="align-items: stretch;">
      <!-- Bento Widget: Pomodoro Focus Timer -->
      <div class="col-5" style="display: flex; flex-direction: column;">
        <div class="bento-card pomodoro-card" style="height: 100%; flex: 1;">
          <div class="bento-card-header" style="width: 100%;">
            <div class="bento-card-title-group">
              <div class="bento-card-icon">${getIcon('timer')}</div>
              <div>
                <h3 class="bento-card-title">Pomodoro Focus</h3>
                <span class="bento-card-subtitle">Boost study productivity</span>
              </div>
            </div>
            <button class="btn btn-ghost btn-icon-sm" id="btn-open-pomodoro-settings" title="Timer Settings">
              ${getIcon('settings')}
            </button>
          </div>

          <div class="pomodoro-mode-tabs">
            <button class="pomodoro-mode-btn" data-pomo-mode="work">Focus</button>
            <button class="pomodoro-mode-btn" data-pomo-mode="shortBreak">Short Break</button>
            <button class="pomodoro-mode-btn" data-pomo-mode="longBreak">Long Break</button>
          </div>

          <div class="pomodoro-timer-dial">
            <svg class="pomodoro-svg" viewBox="0 0 200 200">
              <circle class="pomodoro-track" cx="100" cy="100" r="85" />
              <circle class="pomodoro-progress" id="dashboard-pomo-progress" cx="100" cy="100" r="85"
                      stroke-dasharray="534.07"
                      stroke-dashoffset="0" />
            </svg>
            <div class="pomodoro-readout">
              <span class="pomodoro-time" id="dashboard-pomo-time">25:00</span>
              <span class="pomodoro-session-label" id="dashboard-pomo-label">Ready to Focus</span>
            </div>
          </div>

          <div class="pomodoro-controls">
            <button class="btn ${pomodoro.isRunning ? 'btn-secondary' : 'btn-primary'} btn-lg" id="dashboard-pomo-start">
              ${pomodoro.isRunning ? `${getIcon('pause')} Pause` : `${getIcon('play')} Start`}
            </button>
            <button class="btn btn-ghost" id="dashboard-pomo-reset" title="Reset Timer">
              ${getIcon('reset')} Reset
            </button>
          </div>

          <div class="pomodoro-sessions-counter" id="dashboard-pomo-counter">
            ${getIcon('checkCircle', 'icon-sm')} 0 sessions completed
          </div>
        </div>
      </div>

      <!-- Bento Widget: Quick To-Do List -->
      <div class="col-7" style="display: flex; flex-direction: column;">
        <div class="bento-card dashboard-todo-card" style="height: 100%; flex: 1; display: flex; flex-direction: column;">
          <div class="bento-card-header" style="flex-shrink: 0;">
            <div class="bento-card-title-group">
              <div class="bento-card-icon">${getIcon('tasks')}</div>
              <div>
                <h3 class="bento-card-title">Priority Tasks</h3>
                <span class="bento-card-subtitle">Urgent & upcoming tasks</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-subtle btn-sm" id="btn-quick-add-task">
                ${getIcon('plus')} Add Task
              </button>
              <button class="btn btn-ghost btn-sm" id="btn-goto-tasks-view">
                View All ${getIcon('chevronRight', 'icon-sm')}
              </button>
            </div>
          </div>

          <div class="task-list dashboard-task-list" id="dashboard-task-list" style="flex: 1; min-height: 0; max-height: 350px; overflow-y: auto;">
            ${renderDashboardTasks(tasks)}
          </div>
        </div>
      </div>

      <!-- Bento Widget: Today's Schedule Agenda -->
      <div class="col-12">
        <div class="bento-card">
          <div class="bento-card-header">
            <div class="bento-card-title-group">
              <div class="bento-card-icon">${getIcon('calendar')}</div>
              <div>
                <h3 class="bento-card-title">Today's Schedule</h3>
                <span class="bento-card-subtitle">${today.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-subtle btn-sm" id="btn-quick-add-schedule">
                ${getIcon('plus')} Add Occasion
              </button>
              <button class="btn btn-ghost btn-sm" id="btn-goto-schedule-view">
                Full Calendar ${getIcon('chevronRight', 'icon-sm')}
              </button>
            </div>
          </div>

          <div class="agenda-list">
            ${todayOccasions.length === 0 ? `
              <div class="empty-state" style="padding: 24px 0;">
                <p class="empty-state-text">No lectures or events scheduled for today.</p>
              </div>
            ` : todayOccasions.map(occ => {
              const color = getOccasionColor(occ);
              const course = occ.course_id ? state.getCourseById(occ.course_id) : null;
              return `
                <div class="agenda-item" style="border-left: 4px solid ${color};">
                  <div class="agenda-time" style="color: ${color};">
                    <span>${occ.start_time.slice(0, 5)}</span>
                    <span style="color: var(--text-muted); font-weight: 500;">${occ.end_time.slice(0, 5)}</span>
                  </div>
                  <div class="agenda-details">
                    <div class="agenda-title">${escapeHtml(occ.title)}</div>
                    <div class="agenda-meta">
                      <span class="badge" style="background-color: ${color}20; color: ${color}; font-size: 0.675rem;">
                        ${occ.type}
                      </span>
                      ${course ? `<span>· ${escapeHtml(course.title)}</span>` : ''}
                      ${occ.location ? `<span>· ${getIcon('mapPin', 'icon-sm')} ${escapeHtml(occ.location)}</span>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  attachDashboardEvents();
  syncPomodoroUi();
}

function renderDashboardTasks(tasks) {
  if (tasks.length === 0) {
    return `
      <div class="empty-state">
        <p class="empty-state-text">No tasks created yet.</p>
      </div>
    `;
  }

  // Priority sort: pending first, high urgency first
  const sorted = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const urgencyWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
  });

  return sorted.map(t => {
    const countdown = t.due_date ? formatCountdown(t.due_date) : null;
    return `
      <div class="task-card ${t.completed ? 'completed' : ''}" data-task-id="${t.id}">
        <div class="task-card-main">
          <label class="custom-checkbox">
            <input type="checkbox" class="dashboard-task-toggle" ${t.completed ? 'checked' : ''}>
            <span class="checkmark"></span>
          </label>
          <div class="task-card-content">
            <div class="task-title">${escapeHtml(t.title)}</div>
            <div class="task-meta">
              <span class="badge badge-${t.urgency.toLowerCase()}">${t.urgency}</span>
              <span class="badge ${t.scope === 'uni' ? 'badge-uni' : 'badge-personal'}">${t.scope === 'uni' ? 'Uni' : 'Personal'}</span>
              ${countdown ? `<span class="task-date-badge ${countdown.isUrgent ? 'overdue' : ''}">${countdown.text}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function attachDashboardEvents() {
  // Navigation shortcuts
  document.getElementById('btn-goto-tasks-view')?.addEventListener('click', () => {
    document.querySelector('[data-view="tasks"]')?.click();
  });

  document.getElementById('btn-goto-schedule-view')?.addEventListener('click', () => {
    document.querySelector('[data-view="schedule"]')?.click();
  });

  document.getElementById('btn-quick-add-task')?.addEventListener('click', () => openTaskModal());
  document.getElementById('btn-quick-add-schedule')?.addEventListener('click', () => openScheduleModal());

  // Task check toggle inside dashboard
  document.querySelectorAll('.dashboard-task-toggle').forEach(input => {
    input.addEventListener('change', async (e) => {
      const card = e.target.closest('.task-card');
      const taskId = Number(card.dataset.taskId);
      const isCompleted = e.target.checked;
      try {
        await api.tasks.update(taskId, { completed: isCompleted });
        const task = state.tasks.find(t => t.id === taskId);
        if (task) task.completed = isCompleted;
        renderDashboard();
        state.emit('tasksUpdated', state.tasks);
      } catch (err) {
        console.error('Failed to toggle task:', err);
      }
    });
  });

  // Pomodoro controls
  document.getElementById('dashboard-pomo-start')?.addEventListener('click', () => {
    if (pomodoro.isRunning) {
      pomodoro.pause();
    } else {
      pomodoro.start();
    }
  });
  document.getElementById('dashboard-pomo-stop')?.addEventListener('click', () => pomodoro.pause());
  document.getElementById('dashboard-pomo-reset')?.addEventListener('click', () => pomodoro.reset());

  document.querySelectorAll('.pomodoro-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.pomoMode;
      pomodoro.setMode(mode);
    });
  });

  document.getElementById('btn-open-pomodoro-settings')?.addEventListener('click', () => {
    openPomodoroSettingsModal();
  });
}

/**
 * Synchronize Pomodoro UI elements with Pomodoro controller state
 */
export function syncPomodoroUi() {
  const pState = pomodoro.getState();

  const timeEl = document.getElementById('dashboard-pomo-time');
  const labelEl = document.getElementById('dashboard-pomo-label');
  const progressEl = document.getElementById('dashboard-pomo-progress');
  const counterEl = document.getElementById('dashboard-pomo-counter');
  const startBtn = document.getElementById('dashboard-pomo-start');

  if (timeEl) timeEl.textContent = pState.formattedTime;

  if (labelEl) {
    if (pState.isRunning) {
      labelEl.textContent = pState.mode === 'work' ? 'Focusing...' : 'Break Time!';
    } else {
      labelEl.textContent = pState.mode === 'work' ? 'Ready to Focus' : 'Take a rest';
    }
  }

  if (progressEl) {
    const circumference = 534.07;
    const offset = circumference - (pState.progressPercent / 100) * circumference;
    progressEl.style.strokeDashoffset = offset;
    if (pState.mode !== 'work') {
      progressEl.classList.add('break');
    } else {
      progressEl.classList.remove('break');
    }
  }

  if (counterEl) {
    const sessionStr = `${pState.completedSessions} session${pState.completedSessions === 1 ? '' : 's'} completed`;
    const minsStr = pState.totalFocusMinutes > 0 ? ` · ${pState.totalFocusMinutes} mins focused` : '';
    counterEl.innerHTML = `${getIcon('checkCircle', 'icon-sm')} ${sessionStr}${minsStr}`;
  }

  if (startBtn) {
    startBtn.innerHTML = pState.isRunning ? `${getIcon('pause')} Pause` : `${getIcon('play')} Start`;
    if (pState.isRunning) {
      startBtn.classList.remove('btn-primary');
      startBtn.classList.add('btn-secondary');
    } else {
      startBtn.classList.add('btn-primary');
      startBtn.classList.remove('btn-secondary');
    }
  }

  // Active tab pill
  document.querySelectorAll('.pomodoro-mode-btn').forEach(btn => {
    if (btn.dataset.pomoMode === pState.mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Subscribe to pomodoro ticks
pomodoro.subscribe(() => {
  syncPomodoroUi();
});

/**
 * Pomodoro Settings Modal
 */
export function openPomodoroSettingsModal() {
  const modal = document.getElementById('pomodoro-settings-modal');
  if (!modal) return;

  const form = document.getElementById('pomodoro-settings-form');
  form.elements['work'].value = pomodoro.settings.work;
  form.elements['shortBreak'].value = pomodoro.settings.shortBreak;
  form.elements['longBreak'].value = pomodoro.settings.longBreak;

  modal.classList.add('open');
}

export function closePomodoroSettingsModal() {
  const modal = document.getElementById('pomodoro-settings-modal');
  if (modal) modal.classList.remove('open');
}

export function initPomodoroSettingsForm() {
  const form = document.getElementById('pomodoro-settings-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const work = parseInt(form.elements['work'].value, 10) || 25;
    const shortBreak = parseInt(form.elements['shortBreak'].value, 10) || 5;
    const longBreak = parseInt(form.elements['longBreak'].value, 10) || 15;

    pomodoro.updateSettings({ work, shortBreak, longBreak });
    closePomodoroSettingsModal();
  });

  document.getElementById('btn-cancel-pomodoro-settings')?.addEventListener('click', closePomodoroSettingsModal);
  document.getElementById('btn-close-pomodoro-settings-modal')?.addEventListener('click', closePomodoroSettingsModal);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
