import { html } from '../utils/helpers.js';
import { formatDate, formatTime, formatDuration } from '../utils/time.js';
import db from '../db.js';
import { hapticLight } from '../utils/haptics.js';
import router from '../router.js';

export async function renderExerciseDetail(exerciseName) {
  const allWorkouts = await db.getAll('workouts');
  const completed = allWorkouts.filter(w => w.completed).sort((a, b) => b.date.localeCompare(a.date));
  const allPrs = await db.getAll('prs');
  const exercisePrs = allPrs.filter(p => p.exerciseName === exerciseName).sort((a, b) => b.date?.localeCompare(a.date) || 0);

  const relevantWorkouts = completed.filter(w =>
    (w.exercises || []).some(e => e.name === exerciseName && (e.weight || e.reps))
  );

  const currentPR = exercisePrs.length > 0 ? exercisePrs[0] : null;
  const lastWorkout = relevantWorkouts.length > 0 ? relevantWorkouts[0] : null;
  const prevWorkout = relevantWorkouts.length > 1 ? relevantWorkouts[1] : null;

  const lastEx = lastWorkout?.exercises?.find(e => e.name === exerciseName);
  const prevEx = prevWorkout?.exercises?.find(e => e.name === exerciseName);

  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <button class="btn btn-ghost" data-nav="prs" style="padding-left:0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
      </div>

      <div class="animate-fade-in-up">
        <div style="font-size:13px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Exercise Detail</div>
        <div class="page-title" style="font-size:28px;margin-bottom:24px;">${exerciseName}</div>

        <div class="stat-row">
          <div class="stat-card glass">
            <div class="stat-value" style="color:var(--accent);">${currentPR ? currentPR.value + (currentPR.unit ? ' ' + currentPR.unit : '') : '—'}</div>
            <div class="stat-label">Personal Best</div>
            ${currentPR ? html`<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">${currentPR.prName}</div>` : ''}
          </div>
          <div class="stat-card glass">
            <div class="stat-value">${lastEx ? (lastEx.weight || '—') + ' × ' + (lastEx.reps || '—') : '—'}</div>
            <div class="stat-label">Last Workout</div>
          </div>
          <div class="stat-card glass">
            <div class="stat-value" style="color:var(--text-tertiary);">${prevEx ? (prevEx.weight || '—') + ' × ' + (prevEx.reps || '—') : '—'}</div>
            <div class="stat-label">Previous</div>
          </div>
        </div>

        <div class="divider"></div>

        ${exercisePrs.length ? html`
          <div class="section-title">PR History</div>
          <div class="exercise-list mb-16">
            ${exercisePrs.map((pr, i) => html`
              <div class="glass-sm list-item animate-fade-in-up stagger-${Math.min(i + 1, 8)}" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:600;">${pr.prName}</div>
                  <div style="font-size:12px;color:var(--text-tertiary);">${pr.date ? formatDate(pr.date) : ''}${pr.workoutName ? ' · ' + pr.workoutName : ''}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700;color:var(--accent);font-size:18px;">${pr.value}${pr.unit ? ' ' + pr.unit : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${relevantWorkouts.length ? html`
          <div class="section-title">Workout History</div>
          <div class="exercise-list">
            ${relevantWorkouts.map((w, i) => {
              const ex = w.exercises.find(e => e.name === exerciseName);
              return html`
                <div class="glass-sm list-item animate-fade-in-up stagger-${Math.min(i + 1, 8)}" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-weight:500;">${w.name}</div>
                    <div style="font-size:12px;color:var(--text-tertiary);">${formatDate(w.date)}</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-weight:600;">${ex?.weight || '—'} × ${ex?.reps || '—'}</div>
                    ${ex?.sets ? html`<div style="font-size:12px;color:var(--text-tertiary);">${ex.sets} sets</div>` : ''}
                    ${ex?.notes ? html`<div style="font-size:11px;color:var(--text-tertiary);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ex.notes}</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : html`
          <div class="glass-sm" style="padding:24px;text-align:center;color:var(--text-tertiary);">
            No workout history for this exercise yet.
          </div>
        `}
      </div>
    </div>
  `;

  container.querySelector('[data-nav="prs"]')?.addEventListener('click', () => router.navigate('prs'));
}
