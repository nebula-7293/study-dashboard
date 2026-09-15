/**
 * Schedule Module
 * Monthly Calendar, Weekly Timetable, Day Agenda Drawer, Color Dots, Recurrence & CRUD
 */

import { api } from './api.js';
import { state } from './state.js';
import { getIcon } from './icons.js';

let currentCalendarDate = new Date();
let scheduleViewMode = 'month'; // 'month' | 'week'
let selectedDayForAgenda = null;
let editingScheduleId = null;
let selectedTypeFilter = 'all';

// Preset Palette for Occasion Dots
export const COLOR_PRESETS = [
  { label: 'Lavender', hex: '#8B5CF6' },
  { label: 'Rose', hex: '#EF4444' },
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Cyan', hex: '#06B6D4' },
  { label: 'Pink', hex: '#EC4899' },
  { label: 'Indigo', hex: '#6366F1' },
  { label: 'Slate', hex: '#64748B' }
];

export function getOccasionColor(schedule) {
  const custom = localStorage.getItem(`studypulse_schedule_${schedule.id}_color`);
  if (custom) return custom;

  // Default by type
  switch (schedule.type) {
    case 'Lecture': return '#8B5CF6';
    case 'Lab': return '#06B6D4';
    case 'Work': return '#F59E0B';
    case 'Seminar': return '#EC4899';
    default: return '#64748B';
  }
}

export function setOccasionColor(scheduleId, hex) {
  localStorage.setItem(`studypulse_schedule_${scheduleId}_color`, hex);
}

export async function loadSchedules() {
  try {
    const scope = state.getBackendScope();
    const params = {};
    if (scope) params.scope = scope;
    if (selectedTypeFilter !== 'all') params.type = selectedTypeFilter;

    const schedules = await api.schedules.list(params);
    state.schedules = schedules;
    renderSchedule();
    state.emit('schedulesUpdated', schedules);
  } catch (err) {
    console.error('Failed to load schedules:', err);
  }
}

/**
 * Expands recurring schedules for a given date range
 */
export function getOccasionsForDateRange(startDate, endDate) {
  const results = [];
  const startStr = formatDateISO(startDate);
  const endStr = formatDateISO(endDate);

  (state.schedules || []).forEach(occ => {
    if (!occ.day) return;

    const occDate = parseISODate(occ.day);
    const repeat = occ.repeat || 'None';
    const repeatUntil = occ.repeat_until ? parseISODate(occ.repeat_until) : null;

    if (repeat === 'None') {
      if (occ.day >= startStr && occ.day <= endStr) {
        results.push({ ...occ, instanceDate: occ.day });
      }
    } else if (repeat === 'Daily') {
      let cur = new Date(occDate);
      const limit = repeatUntil && repeatUntil < endDate ? repeatUntil : endDate;
      while (cur <= limit) {
        const curStr = formatDateISO(cur);
        if (curStr >= startStr && curStr >= occ.day) {
          results.push({ ...occ, instanceDate: curStr });
        }
        cur.setDate(cur.getDate() + 1);
      }
    } else if (repeat === 'Weekly') {
      let cur = new Date(occDate);
      const limit = repeatUntil && repeatUntil < endDate ? repeatUntil : endDate;
      while (cur <= limit) {
        const curStr = formatDateISO(cur);
        if (curStr >= startStr && curStr >= occ.day) {
          results.push({ ...occ, instanceDate: curStr });
        }
        cur.setDate(cur.getDate() + 7);
      }
    }
  });

  return results;
}

export function renderSchedule() {
  const container = document.getElementById('schedule-view-content');
  if (!container) return;

  const monthYearLabel = currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  container.innerHTML = `
    <div class="schedule-header-bar">
      <div class="calendar-nav-group">
        <h2 class="calendar-current-label">${monthYearLabel}</h2>
        <div class="btn-group" style="display: flex; gap: 4px;">
          <button class="btn btn-secondary btn-icon-sm" id="cal-prev" title="Previous">
            ${getIcon('chevronLeft')}
          </button>
          <button class="btn btn-secondary btn-sm" id="cal-today">Today</button>
          <button class="btn btn-secondary btn-icon-sm" id="cal-next" title="Next">
            ${getIcon('chevronRight')}
          </button>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <!-- Month vs Week View Switcher -->
        <div class="tabs-container">
          <button class="tab-btn ${scheduleViewMode === 'month' ? 'active' : ''}" id="view-mode-month">
            ${getIcon('calendar', 'icon-sm')} Month
          </button>
          <button class="tab-btn ${scheduleViewMode === 'week' ? 'active' : ''}" id="view-mode-week">
            ${getIcon('timer', 'icon-sm')} Week
          </button>
        </div>

        <select class="form-control" id="schedule-type-filter" style="width: auto;">
          <option value="all" ${selectedTypeFilter === 'all' ? 'selected' : ''}>All Types</option>
          <option value="Lecture" ${selectedTypeFilter === 'Lecture' ? 'selected' : ''}>Lecture</option>
          <option value="Lab" ${selectedTypeFilter === 'Lab' ? 'selected' : ''}>Lab</option>
          <option value="Work" ${selectedTypeFilter === 'Work' ? 'selected' : ''}>Work</option>
          <option value="Miscellaneous" ${selectedTypeFilter === 'Miscellaneous' ? 'selected' : ''}>Miscellaneous</option>
          <option value="Seminar" ${selectedTypeFilter === 'Seminar' ? 'selected' : ''}>Seminar</option>
        </select>

        <button class="btn btn-primary" id="btn-open-add-schedule">
          ${getIcon('plus')} Add Occasion
        </button>
      </div>
    </div>

    <div id="schedule-calendar-body">
      ${scheduleViewMode === 'month' ? renderMonthView() : renderWeekView()}
    </div>
  `;

  attachScheduleEvents();
}

/**
 * Render Monthly Calendar View
 */
function renderMonthView() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // European week starts on Monday: 0 is Monday, 6 is Sunday
  let startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();

  // Range for query
  const calStart = new Date(firstDayOfMonth);
  calStart.setDate(calStart.getDate() - startWeekday);

  const calEnd = new Date(calStart);
  calEnd.setDate(calEnd.getDate() + 41); // 6 weeks = 42 days

  const occasions = getOccasionsForDateRange(calStart, calEnd);

  // Group occasions by date string
  const occByDate = {};
  occasions.forEach(o => {
    if (!occByDate[o.instanceDate]) occByDate[o.instanceDate] = [];
    occByDate[o.instanceDate].push(o);
  });

  const todayStr = formatDateISO(new Date());

  let cellsHtml = '';
  let cur = new Date(calStart);

  for (let i = 0; i < 42; i++) {
    const dateStr = formatDateISO(cur);
    const dayNum = cur.getDate();
    const isCurrentMonth = cur.getMonth() === month;
    const isToday = dateStr === todayStr;
    const dayOccasions = occByDate[dateStr] || [];

    // Render dots
    const dotsHtml = dayOccasions.map(occ => {
      const color = getOccasionColor(occ);
      return `<span class="occasion-dot" style="background-color: ${color};" title="${escapeHtml(occ.title)} (${occ.start_time.slice(0, 5)})"></span>`;
    }).join('');

    cellsHtml += `
      <div class="month-day-cell ${!isCurrentMonth ? 'outside-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <div class="month-day-header">
          <span class="month-day-number">${dayNum}</span>
          <div class="month-day-dots">${dotsHtml}</div>
        </div>
      </div>
    `;

    cur.setDate(cur.getDate() + 1);
  }

  return `
    <div class="month-calendar-card">
      <div class="month-weekdays-row">
        <div class="weekday-header-cell">Mon</div>
        <div class="weekday-header-cell">Tue</div>
        <div class="weekday-header-cell">Wed</div>
        <div class="weekday-header-cell">Thu</div>
        <div class="weekday-header-cell">Fri</div>
        <div class="weekday-header-cell">Sat</div>
        <div class="weekday-header-cell">Sun</div>
      </div>
      <div class="month-days-grid">
        ${cellsHtml}
      </div>
    </div>
  `;
}

/**
 * Render Weekly Timetable View
 */
function renderWeekView() {
  const cur = new Date(currentCalendarDate);
  const weekday = (cur.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  cur.setDate(cur.getDate() - weekday); // Start on Monday

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const startDate = weekDays[0];
  const endDate = weekDays[6];
  const occasions = getOccasionsForDateRange(startDate, endDate);

  const occByDate = {};
  occasions.forEach(o => {
    if (!occByDate[o.instanceDate]) occByDate[o.instanceDate] = [];
    occByDate[o.instanceDate].push(o);
  });

  const todayStr = formatDateISO(new Date());

  // Hours: 07:00 to 22:00
  const hours = [];
  for (let h = 7; h <= 22; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }

  const headerCells = weekDays.map(d => {
    const dStr = formatDateISO(d);
    const dayName = d.toLocaleString('default', { weekday: 'short' });
    const isToday = dStr === todayStr;
    return `
      <div class="week-header-cell ${isToday ? 'today' : ''}">
        <div class="week-day-name">${dayName}</div>
        <div class="week-day-date">${d.getDate()}</div>
      </div>
    `;
  }).join('');

  const timeCol = hours.map(h => `
    <div class="time-slot-label">${h}</div>
  `).join('');

  const topOffset = 14; // Matches padding-top of .week-body

  const dayCols = weekDays.map(d => {
    const dStr = formatDateISO(d);
    const dayEvents = occByDate[dStr] || [];

    const lines = hours.map((h, idx) => `
      <div class="time-grid-line" style="top: ${topOffset + idx * 60}px;"></div>
    `).join('');

    const eventBlocks = dayEvents.map(ev => {
      const startMin = timeToMinutes(ev.start_time);
      const endMin = timeToMinutes(ev.end_time);
      const baseMin = 7 * 60; // 07:00
      
      const topPx = topOffset + Math.max(0, (startMin - baseMin));
      const heightPx = Math.max(30, (endMin - startMin));
      const color = getOccasionColor(ev);

      return `
        <div class="time-block-card" style="top: ${topPx}px; height: ${heightPx}px; border-left-color: ${color}; background-color: ${color}15;" data-schedule-id="${ev.id}">
          <div class="time-block-title">${escapeHtml(ev.title)}</div>
          <div class="time-block-time">${ev.start_time.slice(0, 5)} - ${ev.end_time.slice(0, 5)}</div>
          ${ev.location ? `<div style="font-size: 0.675rem; color: var(--text-muted);">${escapeHtml(ev.location)}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="week-day-col" data-date="${dStr}">
        ${lines}
        ${eventBlocks}
      </div>
    `;
  }).join('');

  return `
    <div class="week-calendar-container">
      <div class="week-timetable">
        <div class="week-header-row">
          <div class="week-header-cell" style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; justify-content: center;">Time</div>
          ${headerCells}
        </div>
        <div class="week-body" style="height: ${topOffset + (hours.length) * 60 + 24}px;">
          <div class="week-time-col">
            ${timeCol}
          </div>
          ${dayCols}
        </div>
      </div>
    </div>
  `;
}

function attachScheduleEvents() {
  // Navigation
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    if (scheduleViewMode === 'month') {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    } else {
      currentCalendarDate.setDate(currentCalendarDate.getDate() - 7);
    }
    renderSchedule();
  });

  document.getElementById('cal-next')?.addEventListener('click', () => {
    if (scheduleViewMode === 'month') {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    } else {
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 7);
    }
    renderSchedule();
  });

  document.getElementById('cal-today')?.addEventListener('click', () => {
    currentCalendarDate = new Date();
    renderSchedule();
  });

  // Switch view mode
  document.getElementById('view-mode-month')?.addEventListener('click', () => {
    scheduleViewMode = 'month';
    renderSchedule();
  });

  document.getElementById('view-mode-week')?.addEventListener('click', () => {
    scheduleViewMode = 'week';
    renderSchedule();
  });

  // Type filter
  document.getElementById('schedule-type-filter')?.addEventListener('change', (e) => {
    selectedTypeFilter = e.target.value;
    loadSchedules();
  });

  // Add occasion button
  document.getElementById('btn-open-add-schedule')?.addEventListener('click', () => openScheduleModal());

  // Click on month cell or week cell opens day agenda
  document.querySelectorAll('.month-day-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const dateStr = cell.dataset.date;
      openDayAgendaDrawer(dateStr);
    });
  });

  // Click on time block opens day agenda or edit
  document.querySelectorAll('.time-block-card').forEach(block => {
    block.addEventListener('click', (e) => {
      e.stopPropagation();
      const schedId = Number(block.dataset.scheduleId);
      const sched = state.schedules.find(s => s.id === schedId);
      if (sched) openScheduleModal(sched);
    });
  });
}

/**
 * Open Day Agenda Drawer listing all scheduled occasions for a particular day
 */
export function openDayAgendaDrawer(dateStr) {
  selectedDayForAgenda = dateStr;
  const drawer = document.getElementById('day-agenda-drawer');
  if (!drawer) return;

  const titleEl = document.getElementById('day-agenda-title');
  const bodyEl = document.getElementById('day-agenda-body');

  const parsed = parseISODate(dateStr);
  const formattedDate = parsed.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  if (titleEl) titleEl.textContent = formattedDate;

  // Find occasions for this date
  const occasions = getOccasionsForDateRange(parsed, parsed);

  if (occasions.length === 0) {
    bodyEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${getIcon('calendar')}</div>
        <h4 class="empty-state-title">No occasions scheduled</h4>
        <p class="empty-state-text">Enjoy your free time or schedule a study block!</p>
        <button class="btn btn-primary" id="btn-add-occasion-for-day">
          ${getIcon('plus')} Schedule Occasion
        </button>
      </div>
    `;
  } else {
    bodyEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);">
          ${occasions.length} Occasion${occasions.length === 1 ? '' : 's'}
        </span>
        <button class="btn btn-subtle btn-sm" id="btn-add-occasion-for-day">
          ${getIcon('plus')} Add Occasion
        </button>
      </div>
      <div class="agenda-list">
        ${occasions.map(occ => {
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
                  ${course ? `<span style="font-weight: 600;">${escapeHtml(course.title)}</span>` : ''}
                  ${occ.location ? `<span>${getIcon('mapPin', 'icon-sm')} ${escapeHtml(occ.location)}</span>` : ''}
                </div>
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-ghost btn-icon-sm btn-agenda-edit" data-id="${occ.id}" title="Edit">
                  ${getIcon('edit')}
                </button>
                <button class="btn btn-ghost btn-icon-sm btn-agenda-delete" data-id="${occ.id}" title="Delete">
                  ${getIcon('trash')}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Bind drawer buttons
  document.getElementById('btn-add-occasion-for-day')?.addEventListener('click', () => {
    closeDayAgendaDrawer();
    openScheduleModal(null, dateStr);
  });

  document.querySelectorAll('.btn-agenda-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const occ = state.schedules.find(s => s.id === id);
      if (occ) {
        closeDayAgendaDrawer();
        openScheduleModal(occ);
      }
    });
  });

  document.querySelectorAll('.btn-agenda-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      if (confirm('Delete this occasion?')) {
        try {
          await api.schedules.delete(id);
          state.schedules = state.schedules.filter(s => s.id !== id);
          openDayAgendaDrawer(dateStr); // Refresh drawer
          renderSchedule(); // Refresh calendar
          state.emit('schedulesUpdated', state.schedules);
        } catch (err) {
          alert(`Error deleting occasion: ${err.message}`);
        }
      }
    });
  });

  drawer.classList.add('open');
}

export function closeDayAgendaDrawer() {
  const drawer = document.getElementById('day-agenda-drawer');
  if (drawer) drawer.classList.remove('open');
  selectedDayForAgenda = null;
}

/**
 * Open Modal to Add or Edit Schedule Occasion
 */
export function openScheduleModal(schedule = null, prefilledDate = null, preselectedCourseId = null) {
  editingScheduleId = schedule ? schedule.id : null;
  const modal = document.getElementById('schedule-modal');
  if (!modal) return;

  const titleEl = document.getElementById('schedule-modal-title');
  const form = document.getElementById('schedule-form');

  if (titleEl) titleEl.textContent = schedule ? 'Edit Occasion' : 'Add New Occasion';

  // Populate course dropdown
  const courseSelect = form.elements['course_id'];
  courseSelect.innerHTML = `
    <option value="">-- None / Custom Name --</option>
    ${state.courses.map(c => `
      <option value="${c.id}">${escapeHtml(c.title)} ${c.code ? `(${escapeHtml(c.code)})` : ''}</option>
    `).join('')}
  `;

  form.elements['title'].value = schedule ? schedule.title : '';
  form.elements['type'].value = schedule ? schedule.type : 'Lecture';
  form.elements['course_id'].value = schedule && schedule.course_id ? schedule.course_id : (preselectedCourseId || '');
  form.elements['day'].value = schedule && schedule.day ? schedule.day : (prefilledDate || formatDateISO(new Date()));
  form.elements['start_time'].value = schedule ? schedule.start_time.slice(0, 5) : '09:00';
  form.elements['end_time'].value = schedule ? schedule.end_time.slice(0, 5) : '10:30';
  form.elements['repeat'].value = schedule ? schedule.repeat : 'None';
  form.elements['repeat_until'].value = schedule && schedule.repeat_until ? schedule.repeat_until : '';
  form.elements['location'].value = schedule && schedule.location ? schedule.location : '';
  form.elements['scope'].value = schedule ? schedule.scope : (state.getBackendScope() || 'uni');

  // Populate color picker
  const activeColor = schedule ? getOccasionColor(schedule) : COLOR_PRESETS[0].hex;
  const colorPickerContainer = document.getElementById('occasion-color-picker');
  if (colorPickerContainer) {
    colorPickerContainer.innerHTML = COLOR_PRESETS.map(c => `
      <div class="color-option ${c.hex.toLowerCase() === activeColor.toLowerCase() ? 'selected' : ''}" 
           style="background-color: ${c.hex};" 
           data-color="${c.hex}" 
           title="${c.label}"></div>
    `).join('');

    colorPickerContainer.querySelectorAll('.color-option').forEach(opt => {
      opt.addEventListener('click', () => {
        colorPickerContainer.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });
  }

  modal.classList.add('open');
}

export function closeScheduleModal() {
  const modal = document.getElementById('schedule-modal');
  if (modal) modal.classList.remove('open');
  editingScheduleId = null;
}

export function initScheduleForm() {
  const form = document.getElementById('schedule-form');
  if (!form) return;

  // Auto-fill title if course chosen and title is empty
  form.elements['course_id']?.addEventListener('change', (e) => {
    const courseId = Number(e.target.value);
    const titleInput = form.elements['title'];
    if (courseId && !titleInput.value) {
      const course = state.getCourseById(courseId);
      if (course) titleInput.value = course.title;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseVal = form.elements['course_id'].value;
    const titleVal = form.elements['title'].value.trim();

    let finalTitle = titleVal;
    if (!finalTitle && courseVal) {
      const course = state.getCourseById(Number(courseVal));
      if (course) finalTitle = course.title;
    }

    if (!finalTitle) {
      alert('Please provide a name or choose a course for this occasion.');
      return;
    }

    const data = {
      title: finalTitle,
      type: form.elements['type'].value,
      course_id: courseVal ? Number(courseVal) : null,
      day: form.elements['day'].value || formatDateISO(new Date()),
      start_time: form.elements['start_time'].value,
      end_time: form.elements['end_time'].value,
      repeat: form.elements['repeat'].value,
      repeat_until: form.elements['repeat_until'].value || null,
      location: form.elements['location'].value.trim() || null,
      scope: form.elements['scope'].value,
    };

    // Selected color
    const selectedColorEl = document.querySelector('#occasion-color-picker .color-option.selected');
    const chosenColor = selectedColorEl ? selectedColorEl.dataset.color : COLOR_PRESETS[0].hex;

    try {
      let savedOccasion;
      if (editingScheduleId) {
        savedOccasion = await api.schedules.update(editingScheduleId, data);
        setOccasionColor(editingScheduleId, chosenColor);
      } else {
        savedOccasion = await api.schedules.create(data);
        if (savedOccasion && savedOccasion.id) {
          setOccasionColor(savedOccasion.id, chosenColor);
        }
      }
      closeScheduleModal();
      await loadSchedules();
    } catch (err) {
      alert(`Error saving schedule: ${err.message}`);
    }
  });

  document.getElementById('btn-cancel-schedule')?.addEventListener('click', closeScheduleModal);
  document.getElementById('btn-close-schedule-modal')?.addEventListener('click', closeScheduleModal);
  document.getElementById('btn-close-day-agenda')?.addEventListener('click', closeDayAgendaDrawer);
}

// Date helpers
function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseISODate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] * 60) + parts[1];
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
