export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

export function html(strings, ...values) {
  const parts = strings.reduce((acc, str, i) => {
    acc.push(str);
    if (i < values.length) {
      const v = values[i];
      if (Array.isArray(v)) {
        acc.push(v.join(''));
      } else if (v == null || v === false) {
        acc.push('');
      } else {
        acc.push(v);
      }
    }
    return acc;
  }, []);
  return parts.join('');
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }
  return el;
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function diffText(current, previous) {
  if (previous == null || previous === '') return '';
  const cur = parseFloat(current);
  const prev = parseFloat(previous);
  if (isNaN(cur) || isNaN(prev)) return '';
  const diff = cur - prev;
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return 'No Change';
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
