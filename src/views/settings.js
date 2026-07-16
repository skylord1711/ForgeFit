import { html } from '../utils/helpers.js';
import { hapticLight, hapticMedium } from '../utils/haptics.js';
import db from '../db.js';
import { showModal, closeModal, renderModal } from '../components/modal.js';
import { MODULE_DEFS, getModuleOrder, setModuleOrder, isModuleEnabled, setModuleEnabled } from '../components/dashboard-modules.js';
import { FACT_CATEGORIES } from '../data/fun-facts.js';

export async function renderSettings() {
  const units = await db.getSetting('units', 'lb');
  const theme = await db.getSetting('theme', 'dark');
  const moduleOrder = await getModuleOrder();
  const modulesEnabled = await db.getSetting('modulesEnabled', {});
  const creatineSettings = await db.getSetting('creatineSettings', null);
  const funFactCategories = await db.getSetting('funFactCategories', ['fitness', 'science', 'body', 'nutrition']);

  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title" style="font-size:24px;">Settings</div>
        </div>
      </div>

      <div class="exercise-list">

        <div class="glass-sm" style="padding:16px;">
          <div style="font-size:15px;font-weight:600;margin-bottom:12px;">Units</div>
          <div style="display:flex;gap:8px;">
            <button class="btn ${units === 'lb' ? 'btn-primary' : 'btn-secondary'}" data-set-unit="lb" style="flex:1;min-height:44px;font-size:14px;">Pounds (lb)</button>
            <button class="btn ${units === 'kg' ? 'btn-primary' : 'btn-secondary'}" data-set-unit="kg" style="flex:1;min-height:44px;font-size:14px;">Kilograms (kg)</button>
          </div>
        </div>

        <div class="glass-sm" style="padding:16px;margin-top:10px;">
          <div style="font-size:15px;font-weight:600;margin-bottom:12px;">Theme</div>
          <div style="display:flex;gap:8px;">
            <button class="btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}" data-set-theme="dark" style="flex:1;min-height:44px;font-size:14px;">Dark</button>
            <button class="btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}" data-set-theme="system" style="flex:1;min-height:44px;font-size:14px;">System</button>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section-title" style="padding:0;margin-bottom:8px;">Dashboard Modules</div>

        <div class="glass-sm" style="padding:16px;">
          <div style="font-size:15px;font-weight:600;margin-bottom:12px;">Module Order</div>
          <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:12px;">Drag to reorder modules on your home dashboard.</div>
          <div id="module-order-list">
            ${moduleOrder.map((id, i) => {
              const def = MODULE_DEFS.find(m => m.id === id);
              const enabled = modulesEnabled[id] !== false;
              return html`
                <div class="settings-module-row" data-module-id="${id}" style="display:flex;align-items:center;gap:10px;padding:10px 0;${i < moduleOrder.length - 1 ? 'border-bottom:1px solid var(--border-light);' : ''}">
                  <span style="color:var(--text-tertiary);cursor:grab;font-size:16px;" title="Drag to reorder">⋮⋮</span>
                  <span style="font-size:16px;">${def?.emoji || '📦'}</span>
                  <span style="flex:1;font-size:14px;font-weight:500;">${def?.label || id}</span>
                  <label class="toggle-switch" style="position:relative;width:44px;height:26px;flex-shrink:0;">
                    <input type="checkbox" data-toggle-module="${id}" ${enabled ? 'checked' : ''} style="display:none;" />
                    <span class="toggle-slider" style="position:absolute;inset:0;background:${enabled ? 'var(--accent)' : 'var(--bg-tertiary)'};border-radius:13px;cursor:pointer;transition:var(--transition);">
                      <span style="position:absolute;top:3px;left:${enabled ? '23px' : '3px'};width:20px;height:20px;background:#fff;border-radius:50%;transition:var(--transition);"></span>
                    </span>
                  </label>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="divider"></div>

        <div class="section-title" style="padding:0;margin-bottom:8px;">Creatine Settings</div>

        <div class="glass-sm" style="padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="font-size:15px;font-weight:600;">Enable Creatine Reminder</div>
            <label class="toggle-switch" style="position:relative;width:44px;height:26px;flex-shrink:0;">
              <input type="checkbox" data-toggle-creatine ${creatineSettings?.enabled ? 'checked' : ''} style="display:none;" />
              <span class="toggle-slider" style="position:absolute;inset:0;background:${creatineSettings?.enabled ? 'var(--accent)' : 'var(--bg-tertiary)'};border-radius:13px;cursor:pointer;transition:var(--transition);">
                <span style="position:absolute;top:3px;left:${creatineSettings?.enabled ? '23px' : '3px'};width:20px;height:20px;background:#fff;border-radius:50%;transition:var(--transition);"></span>
              </span>
            </label>
          </div>
          ${creatineSettings?.enabled ? html`
            <div style="margin-top:8px;">
              <label style="font-size:13px;color:var(--text-secondary);margin-bottom:6px;display:block;font-weight:500;">Amount (optional)</label>
              <input class="input" type="text" id="creatine-amount" placeholder="5g daily" value="${creatineSettings?.amount || ''}" />
            </div>
          ` : ''}
        </div>

        <div class="divider"></div>

        <div class="section-title" style="padding:0;margin-bottom:8px;">Fun Fact Categories</div>

        <div class="glass-sm" style="padding:16px;">
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${FACT_CATEGORIES.map(cat => {
              const isEnabled = funFactCategories.includes(cat.id);
              return html`
                <button class="btn ${isEnabled ? 'chip-accent' : 'chip'}" data-toggle-fact-cat="${cat.id}" style="min-height:36px;padding:6px 14px;font-size:13px;${isEnabled ? '' : 'color:var(--text-secondary);'}">
                  ${cat.emoji} ${cat.label}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="divider"></div>

        <button class="btn btn-secondary w-full" data-action="export">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Data
        </button>
        <button class="btn btn-secondary w-full mt-8" data-action="import">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Import Data
        </button>

        <div class="divider"></div>

        <button class="btn btn-danger w-full" data-action="delete-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          Delete All Data
        </button>
      </div>

      <div class="text-center mt-24" style="font-size:12px;color:var(--text-tertiary);">
        ForgeFit v1.0.0<br>
        Made with ❤️
      </div>
    </div>
  `;

  setupListeners(moduleOrder, funFactCategories);
}

function setupListeners(initialOrder, initialCategories) {
  const container = document.getElementById('view-container');

  container.querySelectorAll('[data-set-unit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      hapticLight();
      await db.setSetting('units', btn.dataset.setUnit);
      renderSettings();
    });
  });

  container.querySelectorAll('[data-set-theme]').forEach(btn => {
    btn.addEventListener('click', async () => {
      hapticLight();
      await db.setSetting('theme', btn.dataset.setTheme);
      renderSettings();
    });
  });

  container.querySelectorAll('[data-toggle-module]').forEach(input => {
    input.addEventListener('change', async () => {
      hapticLight();
      const moduleId = input.dataset.toggleModule;
      await setModuleEnabled(moduleId, input.checked);
      renderSettings();
    });
  });

  container.querySelectorAll('[data-toggle-creatine]').forEach(input => {
    input.addEventListener('change', async () => {
      hapticLight();
      const current = await db.getSetting('creatineSettings', null) || {};
      current.enabled = input.checked;
      if (!current.amount) current.amount = '5g';
      await db.setSetting('creatineSettings', current);
      renderSettings();
    });
  });

  const creatineAmount = document.getElementById('creatine-amount');
  if (creatineAmount) {
    let timeout;
    creatineAmount.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const current = await db.getSetting('creatineSettings', null) || {};
        current.amount = creatineAmount.value;
        await db.setSetting('creatineSettings', current);
      }, 500);
    });
  }

  container.querySelectorAll('[data-toggle-fact-cat]').forEach(btn => {
    btn.addEventListener('click', async () => {
      hapticLight();
      const catId = btn.dataset.toggleFactCat;
      let cats = [...initialCategories];
      if (cats.includes(catId)) {
        cats = cats.filter(c => c !== catId);
      } else {
        cats.push(catId);
      }
      await db.setSetting('funFactCategories', cats);
      renderSettings();
    });
  });

  setupDragAndDrop(initialOrder);

  container.querySelector('[data-action="export"]')?.addEventListener('click', async () => {
    hapticLight();
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workouts: await db.getAll('workouts'),
      templates: await db.getAll('templates'),
      prs: await db.getAll('prs'),
      settings: await db.getAll('settings'),
      notes: await db.getAll('notes'),
      creatine: await db.getAll('creatine'),
      events: await db.getAll('events')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forgefit-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  container.querySelector('[data-action="import"]')?.addEventListener('click', () => {
    hapticLight();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.workouts) for (const w of data.workouts) await db.put('workouts', w);
        if (data.templates) for (const t of data.templates) await db.put('templates', t);
        if (data.prs) for (const p of data.prs) await db.put('prs', p);
        if (data.notes) for (const n of data.notes) await db.put('notes', n);
        if (data.creatine) for (const c of data.creatine) await db.put('creatine', c);
        if (data.events) for (const ev of data.events) await db.put('events', ev);
        hapticMedium();
        alert('Data imported successfully!');
      } catch (err) {
        alert('Failed to import data: ' + err.message);
      }
    };
    input.click();
  });

  container.querySelector('[data-action="delete-all"]')?.addEventListener('click', () => {
    hapticLight();
    showModal(renderModal(
      'Delete All Data?',
      html`<p style="color:var(--text-secondary);text-align:center;">This will permanently delete all workouts, templates, personal records, notes, and creatine data. This action cannot be undone.</p>`,
      html`
        <button class="btn btn-danger" id="confirm-delete-all">Delete Everything</button>
        <button class="btn btn-ghost" data-close-modal>Cancel</button>
      `
    ));
    document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
    document.getElementById('confirm-delete-all')?.addEventListener('click', async () => {
      await db.clear('workouts');
      await db.clear('templates');
      await db.clear('prs');
      await db.clear('settings');
      await db.clear('notes');
      await db.clear('creatine');
      await db.clear('events');
      closeModal();
      hapticMedium();
      renderSettings();
    });
  });
}

function setupDragAndDrop(currentOrder) {
  const list = document.getElementById('module-order-list');
  if (!list) return;

  let draggedEl = null;
  let dragIndex = -1;

  list.querySelectorAll('[data-module-id]').forEach(row => {
    row.setAttribute('draggable', 'true');

    row.addEventListener('dragstart', (e) => {
      draggedEl = row;
      dragIndex = [...list.children].indexOf(row);
      row.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', async () => {
      if (draggedEl) draggedEl.style.opacity = '1';
      draggedEl = null;

      const newOrder = [...list.children].map(el => el.dataset.moduleId);
      await setModuleOrder(newOrder);
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = row;
      if (target === draggedEl) return;
      const bounding = target.getBoundingClientRect();
      const offset = e.clientY - bounding.top;
      const mid = bounding.height / 2;
      if (offset < mid) {
        list.insertBefore(draggedEl, target);
      } else {
        list.insertBefore(draggedEl, target.nextSibling);
      }
    });
  });
}
