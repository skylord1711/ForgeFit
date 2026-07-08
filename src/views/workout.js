import { html } from '../utils/helpers.js';
import { generateId } from '../utils/helpers.js';
import { formatTime, formatDuration, getElapsedSeconds, getTodayKey } from '../utils/time.js';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics.js';
import db from '../db.js';
import router from '../router.js';
import { startTimer, stopTimer, renderTimerDisplay } from '../components/timer.js';
import { renderExerciseCard, setupExerciseCardListeners } from '../components/exercise-card.js';
import { showModal, closeModal, renderModal, renderFormField } from '../components/modal.js';

let currentWorkout = null;
let currentExercises = [];
let expandedExercises = new Set();
let timerCleanup = null;
let lastWorkoutCache = {};
let personalBestCache = {};

export async function renderWorkout() {
  const today = getTodayKey();
  const allWorkouts = await db.getAll('workouts');
  currentWorkout = allWorkouts.find(w => w.date === today && !w.completed);

  if (!currentWorkout) {
    const container = document.getElementById('view-container');
    container.innerHTML = html`
      <div class="page">
        <div class="empty-state">
          <div class="empty-state-title">No Active Workout</div>
          <div class="empty-state-text">Start a workout from the home screen to see it here.</div>
          <button class="btn btn-primary mt-16" data-nav="home">Go Home</button>
        </div>
      </div>
    `;
    container.querySelector('[data-nav="home"]')?.addEventListener('click', () => router.navigate('home'));
    return;
  }

  currentExercises = currentWorkout.exercises || [];
  expandedExercises = new Set();

  const completedWorkouts = allWorkouts.filter(w => w.completed && w.id !== currentWorkout.id)
    .sort((a, b) => b.date.localeCompare(a.date) || new Date(b.startTime) - new Date(a.startTime));

  const allPrs = await db.getAll('prs');

  lastWorkoutCache = {};
  personalBestCache = {};

  for (const ex of currentExercises) {
    const lastW = completedWorkouts.find(w =>
      (w.exercises || []).some(e => e.name === ex.name && (e.weight || e.reps))
    );
    if (lastW) {
      const lastEx = (lastW.exercises || []).find(e => e.name === ex.name);
      lastWorkoutCache[ex.name] = lastEx ? { weight: lastEx.weight, reps: lastEx.reps, sets: lastEx.sets, date: lastW.date } : null;
    } else {
      lastWorkoutCache[ex.name] = null;
    }

    const exPrs = allPrs.filter(p => p.exerciseName === ex.name);
    if (exPrs.length > 0) {
      const best = exPrs.reduce((a, b) => {
        const av = parseFloat(a.value) || 0;
        const bv = parseFloat(b.value) || 0;
        return av >= bv ? a : b;
      });
      personalBestCache[ex.name] = { value: best.value, unit: best.unit, prName: best.prName };
    } else {
      personalBestCache[ex.name] = null;
    }
  }

  render();
}

function render() {
  const elapsed = getElapsedSeconds(currentWorkout.startTime);

  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <button class="btn btn-ghost" data-nav="home" style="padding-left:0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Home
        </button>
      </div>

      <div class="text-center animate-fade-in-down">
        <div class="timer-label">Workout Timer</div>
        <div id="timer-display">${renderTimerDisplay(elapsed)}</div>
        <div style="font-size:22px;font-weight:700;color:var(--accent);margin-bottom:4px;">${currentWorkout.name}</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;">
          Started: ${formatTime(currentWorkout.startTime)}
        </div>
      </div>

      <div class="divider"></div>

      <div class="section-title">Exercises</div>
      <div class="exercise-list" id="workout-exercise-list">
        ${currentExercises.map(ex => renderExerciseCard(
          ex,
          lastWorkoutCache[ex.name],
          personalBestCache[ex.name],
          expandedExercises.has(ex.name),
        )).join('')}
      </div>

      <div class="mt-24 flex flex-col gap-8" style="padding-bottom:24px;">
        <button class="btn btn-primary btn-lg w-full" id="finish-workout-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Finish Workout
        </button>
        <button class="btn btn-ghost w-full" id="add-exercise-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Exercise
        </button>
      </div>
    </div>
  `;

  if (timerCleanup) timerCleanup();
  timerCleanup = startTimer(currentWorkout.startTime, (elapsed) => {
    const timerEl = document.getElementById('timer-display');
    if (timerEl) timerEl.innerHTML = renderTimerDisplay(elapsed);
  });

  setupListeners();
  setupExerciseCardListeners(container,
    handleFieldChange,
    toggleExercise,
    handleSavePR
  );
}

function setupListeners() {
  const container = document.getElementById('view-container');

  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => router.navigate(el.dataset.nav));
  });

  document.getElementById('finish-workout-btn')?.addEventListener('click', finishWorkout);
  document.getElementById('add-exercise-btn')?.addEventListener('click', showAddExerciseModal);
}

async function handleFieldChange(exerciseName, field, value) {
  const ex = currentExercises.find(e => e.name === exerciseName);
  if (ex) {
    ex[field] = value;
    currentWorkout.exercises = currentExercises;
    await db.put('workouts', currentWorkout);
  }
}

function toggleExercise(name) {
  if (expandedExercises.has(name)) {
    expandedExercises.delete(name);
  } else {
    expandedExercises.add(name);
  }
  render();
}

function handleSavePR(exerciseName) {
  const ex = currentExercises.find(e => e.name === exerciseName);
  const weight = parseFloat(ex?.weight);
  const reps = parseInt(ex?.reps);

  if (!weight && !reps) {
    showModal(renderModal(
      'No Data',
      html`<p style="color:var(--text-secondary);text-align:center;">Enter weight or reps first to save a PR.</p>`,
      html`<button class="btn btn-primary" data-close-modal>OK</button>`
    ));
    document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
    return;
  }

  const body = html`
    ${renderFormField('PR Name', html`<select class="input" id="pr-name-select">
      <option value="Highest Weight">Highest Weight</option>
      <option value="Best Set">Best Set</option>
      <option value="Best Set of 5">Best Set of 5</option>
      <option value="Best Set of 8">Best Set of 8</option>
      <option value="Best Set of 10">Best Set of 10</option>
      <option value="Estimated 1RM">Estimated 1RM</option>
      <option value="Custom">Custom</option>
    </select>`)}
    ${renderFormField('Value', html`<input class="input" id="pr-value" type="text" placeholder="${weight ? weight + ' lb' : reps + ' reps'}" />`)}
    ${renderFormField('Unit (optional)', html`<input class="input" id="pr-unit" type="text" placeholder="lb, kg, reps, min:sec" />`)}
    ${renderFormField('Notes (optional)', html`<input class="input" id="pr-notes" type="text" placeholder="How did this feel?" />`)}
  `;
  showModal(renderModal('Save PR - ' + exerciseName, body, html`
    <button class="btn btn-primary" id="save-pr-btn">Save PR</button>
    <button class="btn btn-ghost" data-close-modal>Cancel</button>
  `));

  document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  document.getElementById('save-pr-btn')?.addEventListener('click', async () => {
    const prName = document.getElementById('pr-name-select')?.value;
    let value = document.getElementById('pr-value')?.value.trim();
    const unit = document.getElementById('pr-unit')?.value.trim() || (weight ? 'lb' : 'reps');
    const notes = document.getElementById('pr-notes')?.value.trim();

    if (!value) {
      if (prName === 'Custom') { alert('Enter a value'); return; }
      value = weight ? `${weight}` : `${reps}`;
    }

    const pr = {
      id: generateId(),
      exerciseName,
      prName,
      value,
      unit,
      date: getTodayKey(),
      workoutName: currentWorkout.name,
      notes
    };
    await db.put('prs', pr);
    closeModal();
    hapticSuccess();
    showConfetti();
    render();
  });
}

function showAddExerciseModal() {
  const body = renderFormField('Exercise Name', html`<input class="input" id="new-ex-name" type="text" placeholder="e.g. Bench Press" autocomplete="off" />`);
  showModal(renderModal('Add Exercise', body, html`
    <button class="btn btn-primary" id="add-ex-confirm">Add</button>
    <button class="btn btn-ghost" data-close-modal>Cancel</button>
  `));
  document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  document.getElementById('add-ex-confirm')?.addEventListener('click', async () => {
    const name = document.getElementById('new-ex-name')?.value.trim();
    if (!name) return;
    currentExercises.push({ name, weight: '', sets: '', reps: '', notes: '' });
    currentWorkout.exercises = currentExercises;
    await db.put('workouts', currentWorkout);
    closeModal();
    render();
  });
}

async function finishWorkout() {
  hapticMedium();
  if (!currentWorkout || currentWorkout._finishing) return;
  currentWorkout._finishing = true;

  const hasData = currentExercises.some(e => e.weight || e.reps || e.sets);

  if (!hasData) {
    showModal(renderModal(
      'Finish Workout?',
      html`<p style="color:var(--text-secondary);text-align:center;">No exercise data was entered. You can still finish the workout.</p>`,
      html`
        <button class="btn btn-primary" id="confirm-finish">Finish Anyway</button>
        <button class="btn btn-ghost" data-close-modal>Cancel</button>
      `
    ));
    document.querySelector('[data-close-modal]')?.addEventListener('click', () => {
      closeModal();
      currentWorkout._finishing = false;
    });
    document.getElementById('confirm-finish')?.addEventListener('click', async () => {
      closeModal();
      await doFinishWorkout();
    });
    return;
  }

  await doFinishWorkout();
}

async function doFinishWorkout() {
  const now = new Date();
  currentWorkout.finishTime = now.toISOString();
  currentWorkout.duration = getElapsedSeconds(currentWorkout.startTime);
  currentWorkout.completed = true;
  currentWorkout.exercises = currentExercises;
  delete currentWorkout._finishing;

  await db.put('workouts', currentWorkout);

  if (timerCleanup) timerCleanup();
  stopTimer();
  hapticSuccess();
  showConfetti();

  setTimeout(() => {
    router.navigate('home');
  }, 600);
}

export function showConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  const colors = ['#00E676', '#6C63FF', '#FF6B35', '#FF4757', '#FFD93D', '#00D2FF'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (Math.random() * 6 + 4) + 'px';
    piece.style.height = (Math.random() * 6 + 4) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 4000);
}
