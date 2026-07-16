import { html } from '../utils/helpers.js';
import { getTodayKey, formatDate, formatTime } from '../utils/time.js';
import { hapticLight, hapticMedium } from '../utils/haptics.js';
import db from '../db.js';
import router from '../router.js';
import { showModal, closeModal, renderModal } from '../components/modal.js';

export async function renderCreatine() {
  const today = getTodayKey();
  const settings = await db.getSetting('creatineSettings', null);
  const allEntries = await db.getAll('creatine');
  const todayEntry = allEntries.find(e => e.date === today);

  const sortedEntries = allEntries.sort((a, b) => b.date.localeCompare(a.date));

  const render = () => {
    const container = document.getElementById('view-container');
    const currentEntry = allEntries.find(e => e.date === today);
    const stats = computeStats(sortedEntries);

    container.innerHTML = html`
      <div class="page">
        <div class="page-header">
          <div>
            <div class="page-title" style="font-size:24px;">Creatine Tracker</div>
            <div class="page-subtitle" style="margin-bottom:0;">${settings?.amount || '5g'} daily</div>
          </div>
        </div>

        <div class="glass-sm" style="padding:20px;margin-bottom:16px;">
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:40px;margin-bottom:8px;">${currentEntry?.taken ? '✅' : '💊'}</div>
            <div style="font-size:16px;font-weight:600;color:${currentEntry?.taken ? 'var(--accent)' : 'var(--text-secondary)'};">
              ${currentEntry?.taken ? 'Creatine Taken Today' : 'Not Taken Yet'}
            </div>
            ${currentEntry?.taken ? html`
              <div style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">Taken at ${formatTime(currentEntry.time)}</div>
            ` : ''}
          </div>
          ${!currentEntry?.taken ? html`
            <button class="btn btn-primary w-full" id="creatine-mark-today" style="min-height:48px;font-size:16px;">
              Mark as Taken
            </button>
          ` : html`
            <button class="btn btn-ghost w-full" id="creatine-reset-today" style="min-height:44px;font-size:14px;color:var(--orange);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle;"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
              Reset Today
            </button>
          `}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
          <div class="glass-sm" style="padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:var(--accent);">${stats.streak}</div>
            <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;">Streak</div>
          </div>
          <div class="glass-sm" style="padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:var(--purple);">${stats.total}</div>
            <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;">Total Days</div>
          </div>
          <div class="glass-sm" style="padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:var(--orange);">${stats.longest}</div>
            <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;">Best Streak</div>
          </div>
        </div>

        <div style="font-size:14px;color:var(--text-secondary);text-align:center;margin-bottom:20px;">
          ${stats.streak > 0 ? `${stats.streak} day streak. Keep building consistency.` : 'Start a new streak today.'}
        </div>

        <div class="section-title" style="padding:0;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
          <span>History</span>
          <button class="btn btn-secondary" id="creatine-add-entry" style="min-height:32px;padding:4px 12px;font-size:12px;">+ Add Entry</button>
        </div>
        <div class="exercise-list">
          ${sortedEntries.map(entry => html`
            <div class="glass-sm" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:14px;font-weight:500;">${formatDate(entry.date)}</div>
                ${entry.time ? html`<div style="font-size:12px;color:var(--text-tertiary);">${formatTime(entry.time)}</div>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <button class="btn-icon" data-toggle-creatine="${entry.date}" style="width:32px;height:32px;flex-shrink:0;" title="${entry.taken ? 'Mark as not taken' : 'Mark as taken'}">
                  <span style="font-size:16px;">${entry.taken ? '✅' : '❌'}</span>
                </button>
                <button class="btn-icon" data-delete-creatine="${entry.date}" style="width:32px;height:32px;flex-shrink:0;" title="Remove entry">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
          ${sortedEntries.length === 0 ? html`
            <div style="font-size:14px;color:var(--text-tertiary);text-align:center;padding:24px;">
              No tracking data yet. Mark your first day above.
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('creatine-mark-today')?.addEventListener('click', async () => {
      hapticMedium();
      const now = new Date();
      const entry = {
        date: today,
        taken: true,
        time: now.toISOString(),
        amount: settings?.amount || '5g'
      };
      await db.put('creatine', entry);
      const idx = allEntries.findIndex(e => e.date === today);
      if (idx >= 0) allEntries[idx] = entry;
      else allEntries.push(entry);
      const sIdx = sortedEntries.findIndex(e => e.date === today);
      if (sIdx >= 0) sortedEntries[sIdx] = entry;
      else sortedEntries.unshift(entry);
      render();
    });

    document.getElementById('creatine-reset-today')?.addEventListener('click', async () => {
      hapticMedium();
      const entry = { date: today, taken: false, time: null, amount: null };
      await db.put('creatine', entry);
      const idx = allEntries.findIndex(e => e.date === today);
      if (idx >= 0) allEntries[idx] = entry;
      else allEntries.push(entry);
      const sIdx = sortedEntries.findIndex(e => e.date === today);
      if (sIdx >= 0) sortedEntries[sIdx] = entry;
      else sortedEntries.unshift(entry);
      render();
    });

    container.querySelectorAll('[data-toggle-creatine]').forEach(el => {
      el.addEventListener('click', async () => {
        hapticLight();
        const date = el.dataset.toggleCreatine;
        const entry = allEntries.find(e => e.date === date);
        if (!entry) return;
        const updated = {
          date: entry.date,
          taken: !entry.taken,
          time: !entry.taken ? new Date().toISOString() : null,
          amount: !entry.taken ? (settings?.amount || '5g') : null
        };
        await db.put('creatine', updated);
        const idx = allEntries.findIndex(e => e.date === date);
        if (idx >= 0) allEntries[idx] = updated;
        const sIdx = sortedEntries.findIndex(e => e.date === date);
        if (sIdx >= 0) sortedEntries[sIdx] = updated;
        render();
      });
    });

    container.querySelectorAll('[data-delete-creatine]').forEach(el => {
      el.addEventListener('click', () => {
        hapticLight();
        const date = el.dataset.deleteCreatine;
        const entry = allEntries.find(e => e.date === date);
        if (!entry) return;
        showModal(renderModal(
          'Remove Entry?',
          html`<p style="color:var(--text-secondary);text-align:center;">This will remove the creatine entry for ${formatDate(date)}.</p>`,
          html`
            <button class="btn btn-danger" id="confirm-delete-creatine">Remove</button>
            <button class="btn btn-ghost" data-close-modal>Cancel</button>
          `
        ));
        document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
        document.getElementById('confirm-delete-creatine')?.addEventListener('click', async () => {
          hapticMedium();
          try {
            await db.remove('creatine', date);
            const idx = allEntries.findIndex(e => e.date === date);
            if (idx >= 0) allEntries.splice(idx, 1);
            const sIdx = sortedEntries.findIndex(e => e.date === date);
            if (sIdx >= 0) sortedEntries.splice(sIdx, 1);
            closeModal();
            render();
          } catch (err) {
            console.error('Failed to delete creatine entry:', err);
            closeModal();
          }
        });
      });
    });

    document.getElementById('creatine-add-entry')?.addEventListener('click', () => {
      hapticLight();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(yesterday);
      showModal(renderModal(
        'Add Creatine Entry',
        html`
          <div style="text-align:center;">
            <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:6px;font-weight:500;">Date</label>
            <input class="input" type="date" id="add-creatine-date" value="${yesterdayKey}" max="${today}" style="text-align:center;" />
          </div>
        `,
        html`
          <button class="btn btn-primary" id="confirm-add-creatine">Mark as Taken</button>
          <button class="btn btn-ghost" data-close-modal>Cancel</button>
        `
      ));
      document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
      document.getElementById('confirm-add-creatine')?.addEventListener('click', async () => {
        hapticMedium();
        const dateInput = document.getElementById('add-creatine-date');
        const date = dateInput?.value;
        if (!date || date > today) return;
        const existing = allEntries.find(e => e.date === date);
        const entry = {
          date,
          taken: true,
          time: existing?.time || new Date().toISOString(),
          amount: settings?.amount || '5g'
        };
        await db.put('creatine', entry);
        const idx = allEntries.findIndex(e => e.date === date);
        if (idx >= 0) allEntries[idx] = entry;
        else allEntries.push(entry);
        const sIdx = sortedEntries.findIndex(e => e.date === date);
        if (sIdx >= 0) sortedEntries[sIdx] = entry;
        else sortedEntries.push(entry);
        sortedEntries.sort((a, b) => b.date.localeCompare(a.date));
        closeModal();
        render();
      });
    });
  };

  render();
}

function computeStats(sortedEntries) {
  const takenEntries = sortedEntries.filter(e => e.taken);
  let streak = 0;
  let longest = 0;
  let currentStreak = 0;
  const today = getTodayKey();

  const dateSet = new Set(takenEntries.map(e => e.date));

  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  while (dateSet.has(checkDate.toISOString().split('T')[0])) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const sortedDates = takenEntries.map(e => e.date).sort();
  currentStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }
    if (currentStreak > longest) longest = currentStreak;
  }

  return {
    streak,
    total: takenEntries.length,
    longest
  };
}
