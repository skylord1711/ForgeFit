import db from './db.js';
import router from './router.js';
import { renderBottomNav } from './components/bottom-nav.js';
import { renderHome } from './views/home.js';
import { renderChooseWorkout } from './views/choose-workout.js';
import { renderWorkout } from './views/workout.js';
import { renderHistory, renderWorkoutSummary } from './views/history.js';
import { renderPrs } from './views/prs.js';
import { renderSettings } from './views/settings.js';
import { renderExerciseDetail } from './views/exercise-detail.js';
import { renderManageTemplates } from './views/manage-templates.js';

let currentCleanup = null;

export async function initApp() {
  await db.openDB();

  router.add('home', async () => {
    renderBottomNav('home');
    if (currentCleanup) currentCleanup();
    currentCleanup = await renderHome();
  });

  router.add('choose-workout', async () => {
    renderBottomNav('');
    if (currentCleanup) currentCleanup();
    await renderChooseWorkout();
  });

  router.add('workout', async () => {
    renderBottomNav('');
    if (currentCleanup) currentCleanup();
    await renderWorkout();
  });

  router.add('history', async () => {
    renderBottomNav('history');
    if (currentCleanup) currentCleanup();
    await renderHistory();
  });

  router.add('workout-summary/:id', async (params) => {
    renderBottomNav('');
    if (currentCleanup) currentCleanup();
    await renderWorkoutSummary(params.id);
  });

  router.add('prs', async () => {
    renderBottomNav('prs');
    if (currentCleanup) currentCleanup();
    await renderPrs();
  });

  router.add('exercise/:name', async (params) => {
    renderBottomNav('');
    if (currentCleanup) currentCleanup();
    await renderExerciseDetail(params.name);
  });

  router.add('workouts', async () => {
    renderBottomNav('workouts');
    if (currentCleanup) currentCleanup();
    await renderManageTemplates();
  });

  router.add('settings', async () => {
    renderBottomNav('settings');
    if (currentCleanup) currentCleanup();
    await renderSettings();
  });

  router.init();

  document.getElementById('splash')?.classList.add('hide');
  document.getElementById('app').style.display = 'flex';

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.log('SW registration failed:', e);
    }
  }
}
