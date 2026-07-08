import { html } from '../utils/helpers.js';
import { hapticLight } from '../utils/haptics.js';

export function renderExerciseCard(exercise, lastWorkoutData, personalBest, isExpanded, onToggle, onSavePR) {
  const last = lastWorkoutData || {};
  const best = personalBest || {};

  const lastStr = last.weight ? `${last.weight} ${last.reps ? '× ' + last.reps : ''}` : '—';
  const bestStr = best.value ? `${best.value} ${best.unit || ''}` : '—';

  const diff = getDifference(last, best);
  const diffClass = diff === 'New PR' ? 'positive' : diff === 'No Change' ? 'neutral' : diff.startsWith('+') ? 'positive' : diff.startsWith('-') ? 'negative' : 'neutral';

  return html`
    <div class="exercise-card animate-scale-in" data-exercise="${exercise.name}">
      <div class="exercise-card-header" data-toggle="${exercise.name}">
        <span class="exercise-name">${exercise.name}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: ${isExpanded ? 'rotate(180deg)' : 'none'}; transition: transform 0.25s ease;">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="exercise-stats">
        <span class="exercise-stat">Last: <strong>${lastStr}</strong></span>
        <span class="exercise-stat">Best: <strong>${bestStr}</strong></span>
        <span class="exercise-diff ${diffClass}">${diff}</span>
      </div>
      <div class="exercise-body ${isExpanded ? 'open' : ''}">
        <div class="exercise-fields">
          <div class="input-row">
            <input class="input" type="number" inputmode="decimal" placeholder="Weight (lb)" data-ex="${exercise.name}" data-field="weight" value="${exercise.weight || ''}" />
            <input class="input" type="number" inputmode="numeric" placeholder="Sets" data-ex="${exercise.name}" data-field="sets" value="${exercise.sets || ''}" />
            <input class="input" type="number" inputmode="numeric" placeholder="Reps" data-ex="${exercise.name}" data-field="reps" value="${exercise.reps || ''}" />
          </div>
          <input class="input" type="text" placeholder="Notes (optional)" data-ex="${exercise.name}" data-field="notes" value="${exercise.notes || ''}" />
        </div>
        <div class="exercise-actions">
          <button class="btn btn-ghost" data-save-pr="${exercise.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Save PR
          </button>
        </div>
      </div>
    </div>
  `;
}

function getDifference(current, best) {
  if (!best) return '';
  const cur = parseFloat(current.weight) || 0;
  const bv = parseFloat(best.value) || 0;
  if (cur === 0 && !current.reps) return '';
  if (cur === 0 && current.reps) {
    const curReps = parseInt(current.reps) || 0;
    const bestReps = parseInt(best.reps) || 0;
    if (curReps === 0) return '';
    if (curReps > bestReps) return 'New PR';
    if (curReps === bestReps) return 'No Change';
    return `${curReps - bestReps} reps`;
  }
  if (cur > bv) return 'New PR';
  if (cur === bv) {
    const curReps = parseInt(current.reps) || 0;
    const bestReps = parseInt(best.reps) || 0;
    if (curReps > bestReps) return 'New PR';
    if (curReps === bestReps) return 'No Change';
    if (bestReps > 0) return `${curReps - bestReps} reps`;
    return 'No Change';
  }
  const diff = cur - bv;
  return diff > 0 ? `+${diff}` : `${diff}`;
}

export function setupExerciseCardListeners(container, onFieldChange, onToggle, onSavePR) {
  container.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', () => {
      hapticLight();
      onToggle(el.dataset.toggle);
    });
  });

  container.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('input', () => {
      onFieldChange(el.dataset.ex, el.dataset.field, el.value);
    });
    el.addEventListener('blur', () => {
      onFieldChange(el.dataset.ex, el.dataset.field, el.value);
    });
  });

  container.querySelectorAll('[data-save-pr]').forEach(el => {
    el.addEventListener('click', () => {
      hapticLight();
      onSavePR(el.dataset.savePr);
    });
  });
}
