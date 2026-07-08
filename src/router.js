class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.currentParams = {};
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('popstate', () => this.resolve());
  }

  add(pattern, handler) {
    this.routes[pattern] = handler;
    return this;
  }

  navigate(path) {
    history.replaceState(null, '', `#${path}`);
    this.resolve();
  }

  resolve() {
    const hash = window.location.hash.slice(1) || 'home';
    for (const [pattern, handler] of Object.entries(this.routes)) {
      const params = this.match(pattern, hash);
      if (params !== null) {
        this.currentRoute = pattern;
        this.currentParams = params;
        handler(params);
        return;
      }
    }
  }

  match(pattern, hash) {
    const patternParts = pattern.split('/');
    const hashParts = hash.split('/');
    if (patternParts.length !== hashParts.length) return null;
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(hashParts[i]);
      } else if (patternParts[i] !== hashParts[i]) {
        return null;
      }
    }
    return params;
  }

  init() {
    this.resolve();
  }
}

export const router = new Router();
export default router;
