/**
 * Grades & Progress Module
 * Circular/radial graphs for GPA and ECTS vs targeted goals,
 * course breakdown table, and interactive what-if calculator.
 */

import { api } from './api.js';
import { state } from './state.js';
import { getIcon } from './icons.js';
import { scoreToGrade, openCourseModal } from './courses.js';

let targetGpa = parseFloat(localStorage.getItem('studypulse_target_gpa') || '3.8');
let targetCredits = parseFloat(localStorage.getItem('studypulse_target_credits') || '30.0');

export async function loadGrades() {
  try {
    const scope = state.getBackendScope();
    const gpaData = await api.courses.getGpa(scope ? { scope } : {});
    state.gpaData = gpaData;
    renderGrades();
    state.emit('gpaUpdated', gpaData);
  } catch (err) {
    console.error('Failed to load GPA data:', err);
  }
}

export function renderGrades() {
  const container = document.getElementById('grades-view-content');
  if (!container) return;

  const data = state.gpaData || {
    ects_average: 0.0,
    ects_letter: 'N/A',
    gpa_average: 0.0,
    total_credits: 0.0,
    earned_credits: 0.0
  };

  const courses = state.courses || [];

  // Radial calculation (Circumference: 2 * Math.PI * 65 ≈ 408.4)
  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  // GPA progress (max 4.0)
  const gpaPercent = Math.min(100, Math.max(0, (data.gpa_average / 4.0) * 100));
  const gpaOffset = circumference - (gpaPercent / 100) * circumference;

  // Credits progress (earned vs total or target)
  const creditsGoal = Math.max(targetCredits, data.total_credits || 1);
  const creditsPercent = Math.min(100, Math.max(0, (data.earned_credits / creditsGoal) * 100));
  const creditsOffset = circumference - (creditsPercent / 100) * circumference;

  // ECTS Avg percent (0 - 100)
  const ectsPercent = Math.min(100, Math.max(0, data.ects_average));
  const ectsOffset = circumference - (ectsPercent / 100) * circumference;

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.35rem; font-weight: 800;">Academic Performance & Progress</h2>
      <p style="font-size: 0.85rem; color: var(--text-muted);">Weighted ECTS & US 4.0 GPA metrics with target projection</p>
    </div>

    <!-- 3 Radial Progress Cards -->
    <div class="grades-overview-grid">
      <!-- Card 1: GPA Gauge -->
      <div class="radial-card">
        <h4 style="font-size: 0.95rem; font-weight: 700;">US GPA Scale</h4>
        <div class="radial-chart-container">
          <svg class="radial-chart-svg" viewBox="0 0 160 160">
            <circle class="radial-circle-bg" cx="80" cy="80" r="${radius}" />
            <circle class="radial-circle-progress" cx="80" cy="80" r="${radius}" 
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${gpaOffset}" />
          </svg>
          <div class="radial-center-content">
            <span class="radial-center-value">${(data.gpa_average || 0).toFixed(2)}</span>
            <span class="radial-center-label">out of 4.00</span>
          </div>
        </div>
        <div class="radial-target-pill">Target: ${targetGpa.toFixed(2)} GPA</div>
      </div>

      <!-- Card 2: ECTS Weighted Average -->
      <div class="radial-card">
        <h4 style="font-size: 0.95rem; font-weight: 700;">ECTS Grade Average</h4>
        <div class="radial-chart-container">
          <svg class="radial-chart-svg" viewBox="0 0 160 160">
            <circle class="radial-circle-bg" cx="80" cy="80" r="${radius}" />
            <circle class="radial-circle-progress" cx="80" cy="80" r="${radius}" 
                    stroke="#06b6d4"
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${ectsOffset}" />
          </svg>
          <div class="radial-center-content">
            <span class="radial-center-value">${(data.ects_average || 0).toFixed(1)}%</span>
            <span class="radial-center-label">Grade: ${data.ects_letter || 'N/A'}</span>
          </div>
        </div>
        <div class="radial-target-pill" style="background-color: #ecfeff; color: #0891b2;">
          Scale: A (91+) to Fx (&lt;51)
        </div>
      </div>

      <!-- Card 3: Earned ECTS Credits -->
      <div class="radial-card">
        <h4 style="font-size: 0.95rem; font-weight: 700;">ECTS Credits Earned</h4>
        <div class="radial-chart-container">
          <svg class="radial-chart-svg" viewBox="0 0 160 160">
            <circle class="radial-circle-bg" cx="80" cy="80" r="${radius}" />
            <circle class="radial-circle-progress" cx="80" cy="80" r="${radius}" 
                    stroke="#10b981"
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${creditsOffset}" />
          </svg>
          <div class="radial-center-content">
            <span class="radial-center-value">${(data.earned_credits || 0).toFixed(0)}</span>
            <span class="radial-center-label">of ${(data.total_credits || 0).toFixed(0)} enrolled</span>
          </div>
        </div>
        <div class="radial-target-pill" style="background-color: #ecfdf5; color: #059669;">
          Target Goal: ${targetCredits.toFixed(0)} ECTS
        </div>
      </div>
    </div>

    <!-- Targeted GPA / ECTS What-If Simulator -->
    <div class="calculator-card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="bento-card-icon">${getIcon('calculator')}</div>
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 800;">Targeted GPA / ECTS Simulator</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Simulate grades needed in upcoming credits to hit your graduation goal</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="font-size: 0.8rem; font-weight: 600;">Target GPA:</label>
          <input type="number" id="input-target-gpa" class="form-control" style="width: 85px;" step="0.05" min="0" max="4.0" value="${targetGpa}">
          
          <label style="font-size: 0.8rem; font-weight: 600; margin-left: 6px;">Target ECTS:</label>
          <input type="number" id="input-target-credits" class="form-control" style="width: 85px;" step="1" min="1" max="360" value="${targetCredits}">
        </div>
      </div>

      <div id="calculator-result-container">
        ${renderSimulatorResult(data)}
      </div>
    </div>

    <!-- All Courses Table -->
    <div class="grades-table-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 800;">Course Grade Breakdown</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted);">Courses with 0.0% count as completed Fx (0.0 points). Leave blank to mark as In Progress.</p>
        </div>
      </div>
      ${courses.length === 0 ? `
        <p style="color: var(--text-muted); font-size: 0.85rem;">No courses entered yet.</p>
      ` : `
        <table class="grades-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Code</th>
              <th>Credits</th>
              <th>Score %</th>
              <th>ECTS Letter</th>
              <th>US GPA (4.0)</th>
              <th>Scope</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${courses.map(c => {
              const grade = scoreToGrade(c.current_grade);
              const hasGrade = c.current_grade !== null && c.current_grade !== undefined;
              return `
                <tr data-course-id="${c.id}">
                  <td style="font-weight: 700;">${escapeHtml(c.title)}</td>
                  <td><span class="course-code-badge">${escapeHtml(c.code || '—')}</span></td>
                  <td>${c.credits ? `${c.credits.toFixed(1)} ECTS` : '—'}</td>
                  <td>
                    ${hasGrade ? `
                      <strong>${c.current_grade.toFixed(1)}%</strong>
                      ${c.current_grade === 0 ? `<span style="display: block; font-size: 0.675rem; color: var(--color-medium-text); font-weight: 600;">(Counted as 0.0 GPA)</span>` : ''}
                    ` : '<span style="color: var(--text-muted);">In Progress</span>'}
                  </td>
                  <td><span class="badge ${grade.letter === 'A' ? 'badge-low' : grade.letter === 'Fx' ? 'badge-high' : 'badge-uni'}">${grade.letter}</span></td>
                  <td><strong>${grade.gpa}</strong></td>
                  <td><span class="badge ${c.scope === 'uni' ? 'badge-uni' : 'badge-personal'}">${c.scope}</span></td>
                  <td style="text-align: right;">
                    <button class="btn btn-ghost btn-icon-sm btn-edit-course-from-grades" data-course-id="${c.id}" title="Edit Course Grade">
                      ${getIcon('edit')}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;

  attachGradesEvents(data);
}

function renderSimulatorResult(data) {
  const earnedCredits = data.earned_credits || 0;
  const currentGpa = data.gpa_average || 0;
  const remainingCredits = Math.max(0, targetCredits - earnedCredits);

  if (remainingCredits <= 0) {
    return `
      <div class="calculator-result-box">
        <div>
          <h4 style="font-weight: 800; color: var(--primary);">Goal Credits Achieved!</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">
            You have completed ${earnedCredits} ECTS credits, reaching or exceeding your target of ${targetCredits} ECTS.
          </p>
        </div>
        <div class="calculator-result-value">${currentGpa.toFixed(2)} GPA</div>
      </div>
    `;
  }

  // targetGpa = (currentGpa * earnedCredits + neededGpa * remainingCredits) / targetCredits
  const neededGpa = ((targetGpa * targetCredits) - (currentGpa * earnedCredits)) / remainingCredits;
  const maxPossibleGpa = ((currentGpa * earnedCredits) + (4.0 * remainingCredits)) / targetCredits;

  let feedback = '';
  let color = 'var(--primary)';

  if (neededGpa <= 0) {
    feedback = 'You have already secured enough quality points! Maintaining passing grades in your remaining courses will achieve this target.';
  } else if (neededGpa > 4.0) {
    feedback = `Cannot reach a ${targetGpa.toFixed(2)} GPA with only ${remainingCredits.toFixed(0)} credits left (would require an average of ${neededGpa.toFixed(2)} GPA, above the 4.0 maximum). The maximum GPA achievable with straight 4.0s is <strong>${maxPossibleGpa.toFixed(2)}</strong>.<br><br>💡 <em>Tip: If courses in your list are still ongoing and currently have 0%, edit them to clear the grade and mark them 'In Progress'.</em>`;
    color = 'var(--color-high)';
  } else {
    feedback = `You need an average of <strong>${neededGpa.toFixed(2)}</strong> across your remaining <strong>${remainingCredits.toFixed(0)} ECTS credits</strong> to hit your ${targetGpa.toFixed(2)} GPA target.`;
  }

  return `
    <div class="calculator-result-box">
      <div>
        <h4 style="font-weight: 800; color: ${color};">Required Average in Remaining Credits</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.5;">
          ${feedback}
        </p>
      </div>
      <div class="calculator-result-value" style="color: ${color};">
        ${neededGpa > 0 && neededGpa <= 4.0 ? neededGpa.toFixed(2) : (neededGpa <= 0 ? 'Passing' : '> 4.0')}
      </div>
    </div>
  `;
}

function attachGradesEvents(data) {
  const gpaInput = document.getElementById('input-target-gpa');
  const creditsInput = document.getElementById('input-target-credits');

  const onTargetChange = () => {
    if (gpaInput) {
      targetGpa = parseFloat(gpaInput.value) || 3.8;
      localStorage.setItem('studypulse_target_gpa', targetGpa);
    }
    if (creditsInput) {
      targetCredits = parseFloat(creditsInput.value) || 30.0;
      localStorage.setItem('studypulse_target_credits', targetCredits);
    }
    const resultBox = document.getElementById('calculator-result-container');
    if (resultBox) {
      resultBox.innerHTML = renderSimulatorResult(data);
    }
  };

  gpaInput?.addEventListener('input', onTargetChange);
  creditsInput?.addEventListener('input', onTargetChange);

  // Edit course from grades table
  document.querySelectorAll('.btn-edit-course-from-grades').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = Number(btn.dataset.courseId);
      const course = state.courses.find(c => c.id === courseId);
      if (course) openCourseModal(course);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
