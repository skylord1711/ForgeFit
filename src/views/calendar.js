import { html } from '../utils/helpers.js';
import { getTodayKey } from '../utils/time.js';
import { hapticLight, hapticMedium } from '../utils/haptics.js';
import db from '../db.js';
import { showModal, closeModal, renderModal } from '../components/modal.js';
import { getHolidaysForMonth, getHolidayForDate } from '../data/holidays.js';
import { generateId } from '../utils/helpers.js';

let currentYear;
let currentMonth;

export async function renderCalendar() {
  const today = getTodayKey();
  const parts = today.split('-');
  currentYear = parseInt(parts[0], 10);
  currentMonth = parseInt(parts[1], 10) - 1;

  const allEvents = await db.getAll('events');
  render(allEvents, today);
}

function expandRecurringEvents(events, year, month) {
  const expanded = [];
  for (const e of events) {
    if (e.recurring) {
      const [rMonth, rDay] = e.recurring.split('-').map(Number);
      if (rMonth - 1 === month) {
        const dateStr = `${year}-${String(rMonth).padStart(2, '0')}-${String(rDay).padStart(2, '0')}`;
        expanded.push({ ...e, date: dateStr, _recurringInstance: true });
      }
    } else {
      expanded.push(e);
    }
  }
  return expanded;
}

function render(allEvents, today) {
  const container = document.getElementById('view-container');
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const holidays = getHolidaysForMonth(currentYear, currentMonth);
  const expandedEvents = expandRecurringEvents(allEvents, currentYear, currentMonth);
  const monthEvents = expandedEvents.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const calDays = [];
  for (let i = 0; i < firstDay; i++) {
    calDays.push(html`<div class="cal-day cal-day-empty"></div>`);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === today;
    const dayHolidays = holidays.filter(h => h.date === dateStr);
    const dayEvents = monthEvents.filter(e => e.date === dateStr);
    const hasDot = dayHolidays.length > 0 || dayEvents.length > 0;
    const dotColor = dayHolidays.length > 0 ? 'var(--purple)' : 'var(--accent)';

    calDays.push(html`
      <button class="cal-day ${isToday ? 'cal-day-today' : ''}" data-cal-date="${dateStr}" style="position:relative;">
        <span>${d}</span>
        ${hasDot ? html`<span class="cal-dot" style="background:${dotColor};"></span>` : ''}
      </button>
    `);
  }

  const selectedDateEvents = [];
  const selectedHolidays = [];

  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title" style="font-size:24px;">Calendar</div>
        </div>
        <button class="btn btn-primary" id="add-event-btn" style="min-height:40px;padding:8px 16px;font-size:14px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </button>
      </div>

      <div class="glass-sm" style="padding:16px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <button class="btn-icon" id="cal-prev" style="width:36px;height:36px;border:none;background:var(--surface);color:var(--text-secondary);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style="font-size:16px;font-weight:600;">${monthName}</div>
          <button class="btn-icon" id="cal-next" style="width:36px;height:36px;border:none;background:var(--surface);color:var(--text-secondary);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="cal-grid">
          ${dayNames.map(d => html`<div class="cal-header">${d}</div>`).join('')}
          ${calDays.join('')}
        </div>
      </div>

      <div id="cal-day-detail">
        <div style="font-size:13px;color:var(--text-tertiary);text-align:center;padding:16px;">
          Tap a day to see events
        </div>
      </div>
    </div>
  `;

  document.getElementById('cal-prev')?.addEventListener('click', () => {
    hapticLight();
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    render(allEvents, today);
  });

  document.getElementById('cal-next')?.addEventListener('click', () => {
    hapticLight();
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    render(allEvents, today);
  });

  container.querySelectorAll('[data-cal-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      hapticLight();
      showDayDetail(btn.dataset.calDate, allEvents, today);
    });
  });

  document.getElementById('add-event-btn')?.addEventListener('click', () => {
    hapticLight();
    showAddEventModal(today, allEvents);
  });
}

function showDayDetail(dateStr, allEvents, todayKey) {
  const detail = document.getElementById('cal-day-detail');
  if (!detail) return;

  const holiday = getHolidayForDate(dateStr);
  const parts = dateStr.split('-').map(Number);
  const expandedEvents = expandRecurringEvents(allEvents, parts[0], parts[1] - 1);
  const events = expandedEvents.filter(e => e.date === dateStr);
  const d = new Date(dateStr + 'T00:00:00');
  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const isToday = dateStr === todayKey;

  detail.innerHTML = html`
    <div class="glass-sm" style="padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:15px;font-weight:600;${isToday ? 'color:var(--accent);' : ''}">${dayLabel}${isToday ? ' (Today)' : ''}</div>
      </div>
      ${holiday ? html`
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--purple-dim);border:1px solid rgba(108,99,255,0.2);border-radius:var(--radius-sm);margin-bottom:10px;">
          <span style="font-size:18px;">${holiday.emoji}</span>
          <span style="font-size:14px;font-weight:500;color:var(--purple);">${holiday.name}</span>
        </div>
      ` : ''}
      ${events.length ? events.map(e => html`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;${events.indexOf(e) < events.length - 1 ? 'border-bottom:1px solid var(--border-light);' : ''}">
          <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
            <div style="width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0;"></div>
            <div style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.emoji || '📌'} ${e.title}${e._recurringInstance ? ' <span style="font-size:11px;color:var(--text-tertiary);">↻</span>' : ''}</div>
          </div>
          <button class="btn-icon" data-delete-event="${e.id}" style="width:28px;height:28px;border:none;background:transparent;color:var(--text-tertiary);flex-shrink:0;" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('') : html`
        <div style="font-size:13px;color:var(--text-tertiary);text-align:center;padding:8px 0;">
          ${holiday ? 'Holiday only — no custom events' : 'No events'}
        </div>
      `}
    </div>
  `;

  detail.querySelectorAll('[data-delete-event]').forEach(btn => {
    btn.addEventListener('click', async () => {
      hapticLight();
      const id = btn.dataset.deleteEvent;
      await db.remove('events', id);
      const updated = allEvents.filter(e => e.id !== id);
      showDayDetail(dateStr, updated, todayKey);
      render(updated, todayKey);
    });
  });
}

function showAddEventModal(today, allEvents) {
  const emojis = ['📌', '🎂', '🏋️', '🎯', '💊', '🎉', '✈️', '📚', '💼', '🏃', '🧘', '🍽️'];
  let selectedEmoji = '📌';
  let isRecurring = false;

  showModal(renderModal(
    'Add Event',
    html`
      <div style="margin-bottom:16px;">
        <label style="font-size:13px;color:var(--text-secondary);margin-bottom:6px;display:block;font-weight:500;">Date</label>
        <input class="input" type="date" id="event-date" value="${today}" />
      </div>
      <div style="margin-bottom:16px;">
        <label style="font-size:13px;color:var(--text-secondary);margin-bottom:6px;display:block;font-weight:500;">Title</label>
        <input class="input" type="text" id="event-title" placeholder="e.g. Leg Day, Birthday, Flight" maxlength="60" />
      </div>
      <div style="margin-bottom:16px;">
        <label style="font-size:13px;color:var(--text-secondary);margin-bottom:6px;display:block;font-weight:500;">Icon</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${emojis.map(e => html`
            <button class="btn-icon cal-emoji-btn ${e === selectedEmoji ? 'cal-emoji-active' : ''}" data-emoji="${e}" style="width:36px;height:36px;font-size:18px;border:1px solid ${e === selectedEmoji ? 'var(--accent)' : 'var(--border)'};background:${e === selectedEmoji ? 'var(--accent-dim)' : 'var(--surface)'};">
              ${e}
            </button>
          `).join('')}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid var(--border-light);">
        <div>
          <div style="font-size:14px;font-weight:500;">Repeats every year</div>
          <div style="font-size:12px;color:var(--text-tertiary);">e.g. birthdays, anniversaries</div>
        </div>
        <button class="btn-icon" id="toggle-recurring" style="width:44px;height:26px;border-radius:13px;border:none;background:${isRecurring ? 'var(--accent)' : 'var(--bg-tertiary)'};position:relative;transition:var(--transition);">
          <span style="position:absolute;top:3px;left:${isRecurring ? '23px' : '3px'};width:20px;height:20px;background:#fff;border-radius:50%;transition:var(--transition);"></span>
        </button>
      </div>
    `,
    html`
      <button class="btn btn-primary" id="save-event-btn">Save Event</button>
      <button class="btn btn-ghost" data-close-modal>Cancel</button>
    `
  ));

  document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);

  document.querySelectorAll('.cal-emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      hapticLight();
      selectedEmoji = btn.dataset.emoji;
      document.querySelectorAll('.cal-emoji-btn').forEach(b => {
        const isSelected = b.dataset.emoji === selectedEmoji;
        b.classList.toggle('cal-emoji-active', isSelected);
        b.style.borderColor = isSelected ? 'var(--accent)' : 'var(--border)';
        b.style.background = isSelected ? 'var(--accent-dim)' : 'var(--surface)';
      });
    });
  });

  document.getElementById('toggle-recurring')?.addEventListener('click', () => {
    hapticLight();
    isRecurring = !isRecurring;
    const btn = document.getElementById('toggle-recurring');
    if (btn) {
      btn.style.background = isRecurring ? 'var(--accent)' : 'var(--bg-tertiary)';
      btn.querySelector('span').style.left = isRecurring ? '23px' : '3px';
    }
  });

  document.getElementById('save-event-btn')?.addEventListener('click', async () => {
    hapticMedium();
    const date = document.getElementById('event-date')?.value;
    const title = document.getElementById('event-title')?.value?.trim();
    if (!date || !title) return;
    const dateParts = date.split('-');
    const event = {
      id: generateId(),
      date,
      title,
      emoji: selectedEmoji,
      type: 'custom',
      recurring: isRecurring ? `${dateParts[1]}-${dateParts[2]}` : null,
      createdAt: new Date().toISOString()
    };
    await db.put('events', event);
    const all = await db.getAll('events');
    closeModal();
    render(all, today);
  });
}
