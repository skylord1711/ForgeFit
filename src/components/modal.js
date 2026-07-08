import { html } from '../utils/helpers.js';

export function showModal(content) {
  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-content');
  container.innerHTML = content;
  overlay.style.display = 'flex';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.style.display = 'none';
  document.body.style.overflow = '';
}

export function renderModal(title, body, actions = '') {
  return html`
    <div class="modal-handle"></div>
    ${title ? html`<h2 class="modal-title">${title}</h2>` : ''}
    ${body}
    ${actions ? html`<div class="mt-24 flex flex-col gap-8">${actions}</div>` : ''}
  `;
}

export function renderFormField(label, inputHtml) {
  return html`
    <div class="mb-16">
      <label style="display:block; font-size:13px; color:var(--text-secondary); margin-bottom:6px; font-weight:500;">${label}</label>
      ${inputHtml}
    </div>
  `;
}
