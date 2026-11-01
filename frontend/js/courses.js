/**
 * Courses Module
 * Course listing, CRUD, and comprehensive Course Detail view
 * linking associated deadlines and schedule slots.
 */

import { api } from './api.js';
import { state } from './state.js';
import { getIcon } from './icons.js';
import { openDeadlineModal } from './deadlines.js';
import { openScheduleModal, getOccasionColor } from './schedule.js';
import { showConfirmModal } from './confirm.js';

let editingCourseId = null;

export function scoreToGrade(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return { letter: 'N/A', gpa: '—' };
  }
  const s = Number(score);
  if (s >= 91) return { letter: 'A', gpa: '4.0' };
  if (s >= 81) return { letter: 'B', gpa: '3.3' };
  if (s >= 71) return { letter: 'C', gpa: '2.7' };
  if (s >= 61) return { letter: 'D', gpa: '2.0' };
  if (s >= 51) return { letter: 'E', gpa: '1.0' };
  return { letter: 'Fx', gpa: '0.0' };
}

export async function loadCourses() {
  try {
    const scope = state.getBackendScope();
    const courses = await api.courses.list(scope ? { scope } : {});
    state.courses = courses;
    renderCourses();
    state.emit('coursesUpdated', courses);
  } catch (err) {
    console.error('Failed to load courses:', err);
  }
}

export function renderCourses() {
  const container = document.getElementById('courses-view-content');
  if (!container) return;

  const courses = state.courses || [];

  container.innerHTML = `
    <div class="courses-toolbar">
      <div>
        <h2 style="font-size: 1.25rem; font-weight: 800;">All Courses (${courses.length})</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Manage academic and personal study subjects</p>
      </div>
      <button class="btn btn-primary" id="btn-open-add-course">
        ${getIcon('plus')} Add Course
      </button>
    </div>

    <div class="courses-grid">
      ${courses.length === 0 ? `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">${getIcon('courses')}</div>
          <h4 class="empty-state-title">No courses found</h4>
          <p class="empty-state-text">Add your first university or personal course to track grades and schedules.</p>
          <button class="btn btn-primary" id="btn-empty-add-course">
            ${getIcon('plus')} Add Course
          </button>
        </div>
      ` : courses.map(c => {
        const gradeInfo = scoreToGrade(c.current_grade);
        const hasGrade = c.current_grade !== null && c.current_grade !== undefined;

        return `
          <div class="course-card" data-course-id="${c.id}">
            <div class="course-card-top">
              <span class="course-code-badge">${escapeHtml(c.code || 'COURSE')}</span>
              <span class="badge ${c.scope === 'uni' ? 'badge-uni' : 'badge-personal'}">
                ${c.scope === 'uni' ? 'Uni' : 'Personal'}
              </span>
            </div>

            <div class="course-title">${escapeHtml(c.title)}</div>

            <div class="course-metrics-row">
              <div class="course-metric-item">
                <span class="course-metric-label">Credits</span>
                <span class="course-metric-value">${c.credits ? c.credits.toFixed(1) : '—'} <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">ECTS</span></span>
              </div>
              <div class="course-metric-item course-metric-grade">
                <span class="course-metric-label">Grade</span>
                <span class="course-metric-value">
                  ${hasGrade ? `
                    <span class="course-grade-pill badge-uni">
                      <span class="course-grade-main">${c.current_grade.toFixed(0)}% · ${gradeInfo.letter}</span>
                      <span class="course-grade-sub">(${gradeInfo.gpa})</span>
                    </span>
                  ` : `
                    <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-align: center;">In Progress</span>
                  `}
                </span>
              </div>
            </div>

            <div class="course-card-footer">
              <button class="btn btn-subtle btn-sm btn-view-course-detail" data-course-id="${c.id}">
                ${getIcon('courses', 'icon-sm')} View Details & Schedule
              </button>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-ghost btn-icon-sm btn-edit-course" data-course-id="${c.id}" title="Edit course">
                  ${getIcon('edit')}
                </button>
                <button class="btn btn-ghost btn-icon-sm btn-delete-course" data-course-id="${c.id}" title="Delete course">
                  ${getIcon('trash')}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  attachCourseEvents();
}

function attachCourseEvents() {
  ['btn-open-add-course', 'btn-empty-add-course'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => openCourseModal());
  });

  // Click card or view detail button
  document.querySelectorAll('.btn-view-course-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const courseId = Number(btn.dataset.courseId);
      openCourseDetailDrawer(courseId);
    });
  });

  document.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const courseId = Number(card.dataset.courseId);
      openCourseDetailDrawer(courseId);
    });
  });

  // Edit course
  document.querySelectorAll('.btn-edit-course').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const courseId = Number(btn.dataset.courseId);
      const course = state.courses.find(c => c.id === courseId);
      if (course) openCourseModal(course);
    });
  });

  // Delete course
  document.querySelectorAll('.btn-delete-course').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const courseId = Number(btn.dataset.courseId);
      const confirmed = await showConfirmModal({
        title: 'Delete Course',
        message: 'Are you sure you want to delete it?'
      });
      if (confirmed) {
        try {
          await api.courses.delete(courseId);
          state.courses = state.courses.filter(c => c.id !== courseId);
          renderCourses();
          state.emit('coursesUpdated', state.courses);
        } catch (err) {
          alert(`Error deleting course: ${err.message}`);
        }
      }
    });
  });
}

/**
 * Open Course Detail Drawer with linked deadlines and schedules
 */
export function openCourseDetailDrawer(courseId) {
  const course = state.courses.find(c => c.id === courseId);
  if (!course) return;

  const drawer = document.getElementById('course-detail-drawer');
  if (!drawer) return;

  const titleEl = document.getElementById('course-detail-title');
  const bodyEl = document.getElementById('course-detail-body');

  if (titleEl) titleEl.textContent = `${course.title} ${course.code ? `(${course.code})` : ''}`;

  const gradeInfo = scoreToGrade(course.current_grade);
  const hasGrade = course.current_grade !== null && course.current_grade !== undefined;

  // Find linked deadlines & schedules
  const linkedDeadlines = (state.deadlines || []).filter(d => d.course_id === course.id);
  const linkedSchedules = (state.schedules || []).filter(s => s.course_id === course.id);

  bodyEl.innerHTML = `
    <div class="course-detail-hero">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="course-code-badge">${escapeHtml(course.code || 'COURSE')}</span>
          <h3 style="font-size: 1.25rem; font-weight: 800; margin-top: 8px;">${escapeHtml(course.title)}</h3>
        </div>
        <span class="badge ${course.scope === 'uni' ? 'badge-uni' : 'badge-personal'}">
          ${course.scope === 'uni' ? 'University' : 'Personal'}
        </span>
      </div>

      <div class="course-metrics-row" style="background-color: white; border: 1px solid var(--border-subtle); margin-top: 8px;">
        <div class="course-metric-item">
          <span class="course-metric-label">Credits</span>
          <span class="course-metric-value">${course.credits ? course.credits.toFixed(1) : '—'} ECTS</span>
        </div>
        <div class="course-metric-item">
          <span class="course-metric-label">Weighted Score</span>
          <span class="course-metric-value">${hasGrade ? `${course.current_grade.toFixed(1)}%` : 'In Progress'}</span>
        </div>
        <div class="course-metric-item">
          <span class="course-metric-label">Letter / GPA</span>
          <span class="course-metric-value">${gradeInfo.letter} (${gradeInfo.gpa})</span>
        </div>
      </div>
    </div>

    <!-- Linked Deadlines Section -->
    <div class="detail-section-title">
      <span>Deadlines (${linkedDeadlines.length})</span>
      <button class="btn btn-subtle btn-sm" id="btn-add-deadline-for-course">
        ${getIcon('plus')} Add Deadline
      </button>
    </div>

    ${linkedDeadlines.length === 0 ? `
      <p style="font-size: 0.85rem; color: var(--text-muted); padding: 12px 0;">No upcoming deadlines or exams for this course.</p>
    ` : linkedDeadlines.map(d => `
      <div class="linked-item-card">
        <div>
          <div class="linked-item-title">${escapeHtml(d.title)}</div>
          <div class="linked-item-meta">
            <span class="badge ${d.type === 'exam' ? 'badge-exam' : 'badge-assignment'}" style="font-size: 0.675rem;">
              ${d.type}
            </span>
            <span>Due: ${d.due_date || 'No date set'}</span>
          </div>
        </div>
        <span class="badge badge-low" style="font-size: 0.7rem;">Active</span>
      </div>
    `).join('')}

    <!-- Linked Schedule Slots Section -->
    <div class="detail-section-title">
      <span>Schedule & Occasions (${linkedSchedules.length})</span>
      <button class="btn btn-subtle btn-sm" id="btn-add-schedule-for-course">
        ${getIcon('plus')} Add Occasion
      </button>
    </div>

    ${linkedSchedules.length === 0 ? `
      <p style="font-size: 0.85rem; color: var(--text-muted); padding: 12px 0;">No recurring lectures or timetable slots for this course.</p>
    ` : linkedSchedules.map(s => {
      const color = getOccasionColor(s);
      return `
        <div class="linked-item-card" style="border-left: 4px solid ${color};">
          <div>
            <div class="linked-item-title">${escapeHtml(s.title)}</div>
            <div class="linked-item-meta">
              <span>${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}</span>
              ${s.location ? `<span>· ${escapeHtml(s.location)}</span>` : ''}
              <span>· Repeat: ${s.repeat}</span>
            </div>
          </div>
          <span class="badge" style="background-color: ${color}20; color: ${color}; font-size: 0.7rem;">
            ${s.type}
          </span>
        </div>
      `;
    }).join('')}
  `;

  // Bind course detail buttons
  document.getElementById('btn-add-deadline-for-course')?.addEventListener('click', () => {
    closeCourseDetailDrawer();
    openDeadlineModal(null, course.id);
  });

  document.getElementById('btn-add-schedule-for-course')?.addEventListener('click', () => {
    closeCourseDetailDrawer();
    openScheduleModal(null, null, course.id);
  });

  drawer.classList.add('open');
}

export function closeCourseDetailDrawer() {
  const drawer = document.getElementById('course-detail-drawer');
  if (drawer) drawer.classList.remove('open');
}

/**
 * Open Modal to Add or Edit Course
 */
export function openCourseModal(course = null) {
  editingCourseId = course ? course.id : null;
  const modal = document.getElementById('course-modal');
  if (!modal) return;

  const titleEl = document.getElementById('course-modal-title');
  const form = document.getElementById('course-form');

  if (titleEl) titleEl.textContent = course ? 'Edit Course' : 'Add New Course';

  form.elements['title'].value = course ? course.title : '';
  form.elements['code'].value = course && course.code ? course.code : '';
  form.elements['credits'].value = course && course.credits !== null && course.credits !== undefined ? course.credits : '6';
  form.elements['current_grade'].value = course && course.current_grade !== null && course.current_grade !== undefined ? course.current_grade : '';
  form.elements['scope'].value = course ? course.scope : (state.getBackendScope() || 'uni');

  modal.classList.add('open');
}

export function closeCourseModal() {
  const modal = document.getElementById('course-modal');
  if (modal) modal.classList.remove('open');
  editingCourseId = null;
}

export function initCourseForm() {
  const form = document.getElementById('course-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const creditsVal = form.elements['credits'].value;
    const gradeVal = form.elements['current_grade'].value;

    const data = {
      title: form.elements['title'].value.trim(),
      code: form.elements['code'].value.trim() || null,
      credits: creditsVal ? parseFloat(creditsVal) : null,
      current_grade: gradeVal ? parseFloat(gradeVal) : null,
      scope: form.elements['scope'].value,
    };

    if (!data.title) return;

    try {
      if (editingCourseId) {
        await api.courses.update(editingCourseId, data);
      } else {
        await api.courses.create(data);
      }
      closeCourseModal();
      await loadCourses();
    } catch (err) {
      alert(`Error saving course: ${err.message}`);
    }
  });

  document.getElementById('btn-cancel-course')?.addEventListener('click', closeCourseModal);
  document.getElementById('btn-close-course-modal')?.addEventListener('click', closeCourseModal);
  document.getElementById('btn-close-course-detail')?.addEventListener('click', closeCourseDetailDrawer);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
