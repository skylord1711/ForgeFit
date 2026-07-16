import { html } from '../utils/helpers.js';
import { formatDateFull, formatTime, formatDuration, getTodayKey } from '../utils/time.js';
import { hapticLight } from '../utils/haptics.js';
import router from '../router.js';
import db from '../db.js';
import { getDailyFact, FACT_CATEGORIES } from '../data/fun-facts.js';
import { getHolidayForDate } from '../data/holidays.js';

export const MODULE_DEFS = [
  { id: 'today-workout', label: "Today's Workout", emoji: '🏋️' },
  { id: 'creatine', label: 'Creatine Reminder', emoji: '💊' },
  { id: 'fun-fact', label: 'Fun Fact', emoji: '🧠' },
  { id: 'calendar', label: 'Calendar', emoji: '📅' }
];

const DEFAULT_MODULE_ORDER = MODULE_DEFS.map(m => m.id);

export async function getModuleOrder() {
  const order = await db.getSetting('dashboardModules', null);
  return order || DEFAULT_MODULE_ORDER;
}

export async function setModuleOrder(order) {
  await db.setSetting('dashboardModules', order);
}

export async function isModuleEnabled(moduleId) {
  const enabled = await db.getSetting('modulesEnabled', null);
  if (!enabled) return true;
  return enabled[moduleId] !== false;
}

export async function setModuleEnabled(moduleId, enabled) {
  const current = await db.getSetting('modulesEnabled', null) || {};
  current[moduleId] = enabled;
  await db.setSetting('modulesEnabled', current);
}

export async function getEnabledModules() {
  const order = await getModuleOrder();
  const enabled = await db.getSetting('modulesEnabled', null) || {};
  return order.filter(id => enabled[id] !== false);
}

export function renderTodayWorkoutModule(todayWorkout, activeWorkout) {
  if (todayWorkout?.isRestDay) {
    return html`
      <div class="glass-sm dashboard-module animate-fade-in-up" style="padding:16px;">
        <div class="module-header">
          <span class="module-title">Today's Workout</span>
          <span class="chip chip-purple" style="font-size:11px;">Rest Day</span>
        </div>
        <div style="font-size:14px;color:var(--text-secondary);margin-top:8px;">
          Recovery is part of the process. Come back stronger tomorrow.
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:12px 0;">
          <span class="chip chip-purple">😴 Sleep</span>
          <span class="chip chip-purple">💪 Protein</span>
          <span class="chip chip-purple">💧 Hydrate</span>
        </div>
        <button class="btn btn-ghost" data-undo-rest-day style="margin-top:4px;min-height:40px;font-size:14px;color:var(--orange);">Undo Rest Day</button>
      </div>
    `;
  }

  if (todayWorkout) {
    return html`
      <div class="glass-sm dashboard-module animate-fade-in-up" style="padding:16px;">
        <div class="module-header">
          <span class="module-title">Today's Workout</span>
          <span class="chip chip-accent" style="font-size:11px;">✓ Done</span>
        </div>
        <div style="font-size:16px;font-weight:600;color:var(--accent);margin:8px 0 4px;">${todayWorkout.name}</div>
        <div style="font-size:13px;color:var(--text-secondary);">
          ${todayWorkout.startTime ? formatTime(todayWorkout.startTime) : ''}
          ${todayWorkout.duration ? ' · ' + formatDuration(todayWorkout.duration) : ''}
        </div>
        <div class="flex flex-col gap-8" style="margin-top:12px;">
          <button class="btn btn-secondary" data-view-summary="${todayWorkout.id}" style="min-height:40px;font-size:14px;">View Summary</button>
          <button class="btn btn-ghost" data-restart-today style="min-height:40px;font-size:14px;color:var(--orange);">Restart Today</button>
        </div>
      </div>
    `;
  }

  if (activeWorkout) {
    return html`
      <div class="glass-sm dashboard-module animate-fade-in-up" style="padding:16px;">
        <div class="module-header">
          <span class="module-title">Today's Workout</span>
          <span class="chip" style="font-size:11px;background:var(--orange-dim);border-color:rgba(255,107,53,0.2);color:var(--orange);">In Progress</span>
        </div>
        <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin:8px 0 4px;">${activeWorkout.name}</div>
        <button class="btn btn-primary" data-nav="workout" style="margin-top:8px;min-height:40px;font-size:14px;">Resume Workout</button>
      </div>
    `;
  }

  return html`
    <div class="glass-sm dashboard-module animate-fade-in-up" style="padding:16px;">
      <div class="module-header">
        <span class="module-title">Today's Workout</span>
      </div>
      <button class="btn btn-primary w-full" data-nav="choose-workout" style="margin-top:8px;min-height:44px;font-size:15px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Start Workout
      </button>
    </div>
  `;
}

export function renderCreatineModule(creatineEntry, settings) {
  const taken = creatineEntry?.taken;
  const amount = settings?.amount || '5g';

  return html`
    <div class="glass-sm dashboard-module animate-fade-in-up" style="padding:16px;">
      <div class="module-header">
        <span class="module-title">Creatine</span>
        <button class="btn-icon" data-nav="creatine" style="width:32px;height:32px;border:none;background:transparent;color:var(--text-tertiary);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      ${taken ? html`
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
          <span style="font-size:20px;">✅</span>
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:500;color:var(--accent);">Taken today</div>
            <div style="font-size:12px;color:var(--text-tertiary);">${amount} · ${formatTime(creatineEntry.time)}</div>
          </div>
          <button class="btn-icon" data-reset-creatine style="width:32px;height:32px;border:none;background:var(--surface);color:var(--text-tertiary);" title="Reset today">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          </button>
        </div>
      ` : html`
        <div style="margin-top:8px;">
          <button class="btn btn-secondary w-full" id="home-creatine-mark" style="min-height:40px;font-size:14px;">
            Mark as Taken (${amount})
          </button>
        </div>
      `}
    </div>
  `;
}

export function renderFunFactModule(fact, favIds) {
  if (!fact) return '';
  const isFav = favIds.includes(fact.text);

  return html`
    <div class="glass-sm dashboard-module animate-fade-in-up" style="padding:16px;">
      <div class="module-header">
        <span class="module-title">Fun Fact</span>
        <span class="chip" style="font-size:11px;">${getCategoryEmoji(fact.category)}</span>
      </div>
      <div id="fun-fact-text" style="font-size:14px;color:var(--text-secondary);line-height:1.5;margin-top:8px;">
        "${fact.text}"
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn-icon" id="home-fact-next" style="width:32px;height:32px;border:none;background:var(--surface);color:var(--text-secondary);" title="Next Fact">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
        </button>
        <button class="btn-icon" id="home-fact-fav" style="width:32px;height:32px;border:none;background:${isFav ? 'var(--accent-dim)' : 'var(--surface)'};color:${isFav ? 'var(--accent)' : 'var(--text-secondary)'};" title="Save Favorite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? 'var(--accent)' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
        ${favIds.length ? html`
          <button class="btn-icon" id="home-fact-favs" style="width:32px;height:32px;border:none;background:var(--surface);color:var(--text-secondary);position:relative;" title="View Favorites">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            <span style="position:absolute;top:-2px;right:-2px;background:var(--accent);color:#000;font-size:9px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${favIds.length}</span>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function getCategoryEmoji(category) {
  const cat = FACT_CATEGORIES.find(c => c.id === category);
  return cat ? cat.emoji : '🧠';
}

export function renderCalendarModule(events, today) {
  const parts = today.split('-').map(Number);
  const expanded = [];
  for (const e of events) {
    if (e.recurring) {
      const [rMonth, rDay] = e.recurring.split('-').map(Number);
      if (rMonth === parts[1]) {
        const dateStr = `${parts[0]}-${String(rMonth).padStart(2, '0')}-${String(rDay).padStart(2, '0')}`;
        expanded.push({ ...e, date: dateStr, _recurringInstance: true });
      }
    } else {
      expanded.push(e);
    }
  }

  const upcoming = expanded
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const holiday = getHolidayForDate(today);

  return html`
    <div class="glass-sm dashboard-module animate-fade-in-up" style="padding:16px;">
      <div class="module-header">
        <span class="module-title">Calendar</span>
        <button class="btn-icon" data-nav="calendar" style="width:32px;height:32px;border:none;background:transparent;color:var(--text-tertiary);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      ${holiday ? html`
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 10px;background:var(--purple-dim);border-radius:var(--radius-sm);border:1px solid rgba(108,99,255,0.2);">
          <span style="font-size:18px;">${holiday.emoji}</span>
          <div style="font-size:13px;font-weight:500;color:var(--purple);">${holiday.name}</div>
        </div>
      ` : ''}
      ${upcoming.length ? html`
        <div style="margin-top:${holiday ? '10px' : '8px'};">
          ${upcoming.map((e, i) => html`
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;${i < upcoming.length - 1 ? 'border-bottom:1px solid var(--border-light);' : ''}">
              <div style="width:6px;height:6px;border-radius:50%;background:${e.type === 'holiday' ? 'var(--purple)' : 'var(--accent)'};flex-shrink:0;"></div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.emoji || '📌'} ${e.title}${e._recurringInstance ? ' <span style="font-size:11px;color:var(--text-tertiary);">↻</span>' : ''}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">${formatCalendarDate(e.date)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : html`
        <div style="font-size:13px;color:var(--text-tertiary);margin-top:8px;">No upcoming events</div>
      `}
    </div>
  `;
}

function formatCalendarDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = getTodayKey();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrowKey) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
