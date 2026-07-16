import { html, debounce } from '../utils/helpers.js';
import { getCurrentDateFormatted, getCurrentTimeFormatted, getTodayKey, getYesterdayKey, formatDateFull, formatTime, formatDuration, getElapsedSeconds } from '../utils/time.js';
import { hapticMedium, hapticLight } from '../utils/haptics.js';
import db from '../db.js';
import router from '../router.js';
import { getDailyFact, getFactPool } from '../data/fun-facts.js';
import { getHolidayForDate } from '../data/holidays.js';
import { showModal, closeModal, renderModal } from '../components/modal.js';
import {
  renderTodayWorkoutModule,
  renderCreatineModule,
  renderFunFactModule,
  renderCalendarModule,
  getEnabledModules
} from '../components/dashboard-modules.js';

export async function renderHome() {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();

  const allWorkouts = await db.getAll('workouts');
  const todayWorkout = allWorkouts.find(w => w.date === today && w.completed);
  const activeWorkout = allWorkouts.find(w => w.date === today && !w.completed && w.startTime);
  const yesterdayWorkout = allWorkouts.find(w => w.date === yesterday && w.completed);

  const hasMissed = !yesterdayWorkout && !todayWorkout;
  const enabledModules = await getEnabledModules();
  const creatineEntry = (await db.getAll('creatine')).find(e => e.date === today);
  const creatineSettings = await db.getSetting('creatineSettings', null);
  const funFactCategories = await db.getSetting('funFactCategories', ['fitness', 'science', 'body', 'nutrition']);
  const favoriteFacts = await db.getSetting('favoriteFacts', []);
  const allEvents = await db.getAll('events');
  const calendarEvents = allEvents.filter(e => e.type !== 'holiday');
  const todayHoliday = getHolidayForDate(today);
  const currentFactData = await db.getSetting('currentFact', null);
  let fact;

  if (currentFactData && currentFactData.date === today) {
    const pool = getFactPool(funFactCategories);
    fact = pool[currentFactData.index] || getDailyFact(today, funFactCategories);
  } else {
    fact = getDailyFact(today, funFactCategories);
    if (fact) {
      const pool = getFactPool(funFactCategories);
      const idx = pool.indexOf(fact);
      await db.setSetting('currentFact', { date: today, index: idx >= 0 ? idx : 0 });
    }
  }

  let dateTimeInterval;
  let timerInterval;

  const render = () => {
    const currentTime = getCurrentTimeFormatted();
    const currentDate = getCurrentDateFormatted();

    const container = document.getElementById('view-container');
    container.innerHTML = html`
      <div class="page">
        <div class="page-header">
          <div>
            <div class="page-title" style="font-size:20px; margin-bottom:2px;">${currentDate}</div>
            <div class="page-subtitle" style="font-size:34px; font-weight:200; margin-bottom:0; letter-spacing:2px;" id="current-time">${currentTime}</div>
          </div>
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--purple));display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#000;flex-shrink:0;">
            F
          </div>
        </div>

        ${hasMissed && !todayWorkout ? html`
          <div class="missed-banner animate-fade-in-down">
            No workout was completed yesterday.
            <div class="flex gap-8 mt-8" style="justify-content:center;">
              <button class="btn btn-ghost" data-nav="choose-workout" style="font-size:13px;min-height:36px;padding:8px 16px;background:var(--surface);border-radius:var(--radius-md);">
                Continue Today
              </button>
              <button class="btn btn-ghost" data-nav="history" style="font-size:13px;min-height:36px;padding:8px 16px;background:var(--surface);border-radius:var(--radius-md);">
                View History
              </button>
            </div>
          </div>
        ` : ''}

        ${todayHoliday ? html`
          <div class="holiday-banner animate-fade-in-down">
            <span style="font-size:18px;">${todayHoliday.emoji}</span>
            <div style="font-size:14px;font-weight:500;">${todayHoliday.name}</div>
          </div>
        ` : ''}

        <div class="dashboard-modules" id="dashboard-modules">
          ${enabledModules.map((moduleId, i) => {
            const moduleHtml = renderModule(moduleId, {
              todayWorkout, activeWorkout,
              creatineEntry, creatineSettings, fact, favoriteFacts,
              allWorkouts, today, calendarEvents
            });
            return moduleHtml ? html`
              <div class="dashboard-module-wrapper animate-fade-in-up stagger-${Math.min(i + 1, 8)}" data-module="${moduleId}">
                ${moduleHtml}
              </div>
            ` : '';
          }).join('')}
        </div>
      </div>
    `;

    if (dateTimeInterval) clearInterval(dateTimeInterval);
    dateTimeInterval = setInterval(() => {
      const timeEl = document.getElementById('current-time');
      if (timeEl) timeEl.textContent = getCurrentTimeFormatted();
    }, 10000);

    if (timerInterval) clearInterval(timerInterval);
    if (activeWorkout && !todayWorkout) {
      timerInterval = setInterval(() => {
        const timerEl = document.getElementById('active-timer');
        if (timerEl) {
          timerEl.textContent = formatDuration(getElapsedSeconds(activeWorkout.startTime));
        }
      }, 1000);
    }

    setupHomeListeners(container, today, render);
  };

  render();

  return () => {
    if (dateTimeInterval) clearInterval(dateTimeInterval);
    if (timerInterval) clearInterval(timerInterval);
  };
}

function renderModule(moduleId, data) {
  switch (moduleId) {
    case 'today-workout':
      return renderTodayWorkoutModule(data.todayWorkout, data.activeWorkout);
    case 'creatine':
      return renderCreatineModule(data.creatineEntry, data.creatineSettings);
    case 'fun-fact':
      return renderFunFactModule(data.fact, data.favoriteFacts);
    case 'calendar':
      return renderCalendarModule(data.calendarEvents, data.today);
    default:
      return '';
  }
}

function setupHomeListeners(container, today, rerender) {
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      router.navigate(el.dataset.nav);
    });
  });

  container.querySelectorAll('[data-view-summary]').forEach(el => {
    el.addEventListener('click', () => {
      router.navigate(`workout-summary/${el.dataset.viewSummary}`);
    });
  });

  container.querySelectorAll('[data-restart-today]').forEach(el => {
    el.addEventListener('click', async () => {
      hapticLight();
      const allWorkouts = await db.getAll('workouts');
      const todaysWorkouts = allWorkouts.filter(w => w.date === today);
      for (const w of todaysWorkouts) {
        await db.remove('workouts', w.id);
      }
      renderHome();
    });
  });

  container.querySelectorAll('[data-undo-rest-day]').forEach(el => {
    el.addEventListener('click', async () => {
      hapticLight();
      const allWorkouts = await db.getAll('workouts');
      const todaysRest = allWorkouts.filter(w => w.date === today && w.isRestDay);
      for (const w of todaysRest) {
        await db.remove('workouts', w.id);
      }
      renderHome();
    });
  });

  document.getElementById('home-creatine-mark')?.addEventListener('click', async () => {
    hapticMedium();
    const now = new Date();
    const entry = {
      date: today,
      taken: true,
      time: now.toISOString(),
      amount: (await db.getSetting('creatineSettings', null))?.amount || '5g'
    };
    await db.put('creatine', entry);
    renderHome();
  });

  container.querySelectorAll('[data-reset-creatine]').forEach(el => {
    el.addEventListener('click', async () => {
      hapticMedium();
      const entry = { date: today, taken: false, time: null, amount: null };
      await db.put('creatine', entry);
      renderHome();
    });
  });

  document.getElementById('home-fact-next')?.addEventListener('click', async () => {
    hapticLight();
    const cats = await db.getSetting('funFactCategories', ['fitness', 'science', 'body', 'nutrition']);
    const pool = getFactPool(cats);
    if (!pool.length) return;
    const currentFactData = await db.getSetting('currentFact', null);
    const currentIdx = currentFactData?.date === today ? (currentFactData.index || 0) : 0;
    const nextIdx = (currentIdx + 1) % pool.length;
    await db.setSetting('currentFact', { date: today, index: nextIdx });
    const newFact = pool[nextIdx];
    if (newFact) {
      const textEl = document.getElementById('fun-fact-text');
      if (textEl) textEl.textContent = `"${newFact.text}"`;
      const isFav = (await db.getSetting('favoriteFacts', [])).includes(newFact.text);
      const favBtn = document.getElementById('home-fact-fav');
      if (favBtn) {
        favBtn.style.background = isFav ? 'var(--accent-dim)' : 'var(--surface)';
        favBtn.style.color = isFav ? 'var(--accent)' : 'var(--text-secondary)';
        favBtn.querySelector('svg').setAttribute('fill', isFav ? 'var(--accent)' : 'none');
      }
    }
  });

  document.getElementById('home-fact-fav')?.addEventListener('click', async () => {
    hapticLight();
    const favs = await db.getSetting('favoriteFacts', []);
    const cats = await db.getSetting('funFactCategories', ['fitness', 'science', 'body', 'nutrition']);
    const currentFactData = await db.getSetting('currentFact', null);
    const pool = getFactPool(cats);
    const currentIdx = currentFactData?.date === today ? (currentFactData.index || 0) : 0;
    const fact = pool[currentIdx] || getDailyFact(today, cats);
    if (!fact) return;
    const idx = favs.indexOf(fact.text);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(fact.text);
    }
    await db.setSetting('favoriteFacts', favs);
    renderHome();
  });

  document.getElementById('home-fact-favs')?.addEventListener('click', async () => {
    hapticLight();
    const favs = await db.getSetting('favoriteFacts', []);
    if (!favs.length) return;
    showModal(renderModal(
      'Saved Facts',
      html`<div style="max-height:50vh;overflow-y:auto;">
        ${favs.map((text, i) => html`
          <div style="padding:12px 0;${i < favs.length - 1 ? 'border-bottom:1px solid var(--border-light);' : ''}">
            <div style="font-size:14px;color:var(--text-secondary);line-height:1.5;">"${text}"</div>
            <button class="btn-icon" data-remove-fav="${i}" style="width:24px;height:24px;border:none;background:transparent;color:var(--text-tertiary);margin-top:4px;" title="Remove">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        `).join('')}
      </div>`,
      html`<button class="btn btn-ghost" data-close-modal style="min-height:40px;">Close</button>`
    ));
    document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
    document.querySelectorAll('[data-remove-fav]').forEach(btn => {
      btn.addEventListener('click', async () => {
        hapticLight();
        const idx = parseInt(btn.dataset.removeFav, 10);
        favs.splice(idx, 1);
        await db.setSetting('favoriteFacts', favs);
        closeModal();
        renderHome();
      });
    });
  });
}
