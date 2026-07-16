import { html } from '../utils/helpers.js';
import router from '../router.js';

export function renderBottomNav(activeRoute) {
  const nav = document.getElementById('bottom-nav');
  const items = [
    { id: 'home', label: 'Home', icon: homeIcon },
    { id: 'notes', label: 'Notes', icon: notesIcon },
    { id: 'history', label: 'History', icon: historyIcon },
    { id: 'prs', label: 'PRs', icon: prIcon },
    { id: 'settings', label: 'Settings', icon: settingsIcon },
  ];

  const root = activeRoute === 'home' ? '' : activeRoute?.split('/')[0] || 'home';

  nav.innerHTML = items.map(item => html`
    <button class="nav-item ${root === item.id ? 'active' : ''}" data-nav="${item.id}">
      ${item.icon}
      <span class="nav-label">${item.label}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      router.navigate(btn.dataset.nav);
    });
  });
}

const homeIcon = html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
  </svg>
`;

const notesIcon = html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
`;

const historyIcon = html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
`;

const prIcon = html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9V3M6 9a3 3 0 010 6M6 9h12M6 15a3 3 0 100 6m0-6h12M18 9V3m0 6a3 3 0 010 6m0-6H6"/>
  </svg>
`;

const settingsIcon = html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a2 2 0 001 2.65l.06.03a2 2 0 01.73 2.73 2 2 0 01-2.73.73l-.06-.03a2 2 0 00-2.65 1l-.03.06a2 2 0 01-2.73.73 2 2 0 01-.73-2.73l.03-.06a2 2 0 00-1-2.65 2 2 0 01-2.65-1 2 2 0 01.73-2.73l.06-.03a2 2 0 001-2.65 2 2 0 012.73-.73l.06.03a2 2 0 002.65-1 .05.05 0 01.03-.06 2 2 0 012.73-.73 2 2 0 01.73 2.73l-.03.06a2 2 0 001 2.65 2 2 0 012.65 1 2 2 0 01-.73 2.73l-.06.03z"/>
  </svg>
`;
