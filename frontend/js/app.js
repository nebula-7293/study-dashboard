/**
 * StudyPulse Application Orchestrator
 * Bootstraps views, scope toggles, modals, and event subscriptions
 */

import { state } from './state.js';
import { getIcon } from './icons.js';
import { renderDashboard, initPomodoroSettingsForm } from './dashboard.js';
import { loadTasks, renderTasks, initTaskForm, openTaskModal } from './tasks.js';
import { loadDeadlines, renderDeadlines, initDeadlineForm, openDeadlineModal } from './deadlines.js';
import { loadCourses, renderCourses, initCourseForm, openCourseModal } from './courses.js';
import { loadSchedules, renderSchedule, initScheduleForm, openScheduleModal } from './schedule.js';
import { loadGrades, renderGrades } from './grades.js';

const VIEW_TITLES = {
  dashboard: 'StudyPulse Dashboard',
  tasks: 'To-Do & Urgency',
  schedule: 'Timetable & Calendar',
  deadlines: 'Deadlines & Exams',
  courses: 'Enrolled Courses',
  grades: 'Grades & GPA Calculator'
};

async function init() {
  console.log('Initializing StudyPulse frontend...');

  // 1. Immediately determine and activate the view so there is no delay or flash of dashboard
  const initialView = getStoredOrHashView();
  switchView(initialView, true);

  // 2. Setup form submit handlers
  initTaskForm();
  initDeadlineForm();
  initCourseForm();
  initScheduleForm();
  initPomodoroSettingsForm();

  // 3. Navigation setup
  setupNavigation();

  // 4. Scope switcher setup
  setupScopeSwitcher();

  // 5. Global Quick Add Button (+) in Header
  setupGlobalQuickAdd();

  // 6. Keyboard shortcut (Escape closes modals)
  setupKeyboardShortcuts();

  // 7. Reactive state listeners
  state.on('scopeChanged', async () => {
    await refreshAllData();
  });

  state.on('tasksUpdated', () => {
    renderTasks();
    if (state.currentView === 'dashboard') renderDashboard();
  });

  state.on('deadlinesUpdated', () => {
    renderDeadlines();
    if (state.currentView === 'dashboard') renderDashboard();
  });

  state.on('schedulesUpdated', () => {
    renderSchedule();
    if (state.currentView === 'dashboard') renderDashboard();
  });

  state.on('coursesUpdated', async () => {
    renderCourses();
    await loadGrades();
    renderDeadlines();
    renderSchedule();
    if (state.currentView === 'dashboard') renderDashboard();
  });

  // 8. Load all data
  await refreshAllData();
}

function getStoredOrHashView() {
  // 1. Check window.__INITIAL_VIEW__ if set by pre-render script
  if (window.__INITIAL_VIEW__ && VIEW_TITLES[window.__INITIAL_VIEW__]) {
    return window.__INITIAL_VIEW__;
  }

  // 2. Prioritize valid URL hash (e.g. #courses, #schedule)
  const hash = window.location.hash ? window.location.hash.replace('#', '').trim() : '';
  if (hash && VIEW_TITLES[hash]) {
    return hash;
  }

  // 3. Check localStorage for last active view
  try {
    const saved = localStorage.getItem('studypulse_active_view');
    if (saved && VIEW_TITLES[saved]) {
      return saved;
    }
  } catch (e) {
    console.warn('Could not read saved view from localStorage', e);
  }

  // 4. Fallback to dashboard
  return 'dashboard';
}

async function refreshAllData() {
  await Promise.all([
    loadCourses(),
    loadTasks(),
    loadDeadlines(),
    loadSchedules(),
    loadGrades()
  ]);
  renderCurrentView();
}

function renderCurrentView() {
  const viewName = state.currentView;
  if (viewName === 'dashboard') renderDashboard();
  else if (viewName === 'tasks') renderTasks();
  else if (viewName === 'schedule') renderSchedule();
  else if (viewName === 'deadlines') renderDeadlines();
  else if (viewName === 'courses') renderCourses();
  else if (viewName === 'grades') renderGrades();
}

function setupNavigation() {
  // Desktop/Tablet Sidebar nav items
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-view]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
    });
  });

  // Mobile Bottom Bar nav items
  const bottomItems = document.querySelectorAll('.bottom-nav-item[data-view]');
  bottomItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
    });
  });

  // Handle browser back/forward or direct hash navigation
  window.addEventListener('popstate', () => {
    const view = getStoredOrHashView();
    if (view !== state.currentView) {
      switchView(view, false);
    }
  });

  window.addEventListener('hashchange', () => {
    const view = getStoredOrHashView();
    if (view !== state.currentView) {
      switchView(view, false);
    }
  });
}

function switchView(viewName, updateUrl = true) {
  if (!VIEW_TITLES[viewName]) return;
  state.currentView = viewName;

  // Persist to localStorage so refreshing restores this view
  try {
    localStorage.setItem('studypulse_active_view', viewName);
  } catch (e) {
    console.warn('Failed to save active view to localStorage', e);
  }

  // Sync URL hash for bookmarking and history navigation
  if (updateUrl && window.location.hash !== `#${viewName}`) {
    try {
      history.replaceState(null, '', `#${viewName}`);
    } catch (e) {
      window.location.hash = viewName;
    }
  }

  // Update Page Title
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = VIEW_TITLES[viewName];

  // Update Sidebar active state
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update Mobile Bottom Bar active state
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Toggle View Panes
  document.querySelectorAll('.view-pane').forEach(pane => {
    if (pane.id === `view-${viewName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Re-render active view
  renderCurrentView();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupScopeSwitcher() {
  const scopePills = document.querySelectorAll('.scope-pill');
  const activeScope = state.getScope();

  scopePills.forEach(pill => {
    const pillScope = pill.dataset.scope;
    if (pillScope === activeScope) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }

    pill.addEventListener('click', () => {
      scopePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.setScope(pillScope);
    });
  });
}

function setupGlobalQuickAdd() {
  const quickAddBtn = document.getElementById('btn-header-quick-add');
  if (!quickAddBtn) return;

  quickAddBtn.addEventListener('click', () => {
    // Open modal based on current view
    if (state.currentView === 'tasks') openTaskModal();
    else if (state.currentView === 'schedule') openScheduleModal();
    else if (state.currentView === 'deadlines') openDeadlineModal();
    else if (state.currentView === 'courses') openCourseModal();
    else openTaskModal(); // Default to task on dashboard
  });
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
      document.querySelectorAll('.drawer-backdrop.open').forEach(d => d.classList.remove('open'));
    }
  });

  // Close modals when clicking on the backdrop
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  document.querySelectorAll('.drawer-backdrop').forEach(drawer => {
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        drawer.classList.remove('open');
      }
    });
  });
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
