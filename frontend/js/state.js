/**
 * Central Reactive State Manager
 */

class AppState {
  constructor() {
    this.scope = localStorage.getItem('studypulse_scope') || 'all'; // 'all' | 'uni' | 'personal'
    this.currentView = localStorage.getItem('studypulse_active_view') || 'dashboard';
    
    // In-memory cache for fast cross-module lookups
    this.courses = [];
    this.tasks = [];
    this.deadlines = [];
    this.schedules = [];
    this.gpaData = null;

    // Listeners registry
    this.listeners = new Map();
  }

  getScope() {
    return this.scope;
  }

  getBackendScope() {
    // Backend expects 'uni' or 'personal', or null for all
    if (this.scope === 'all') return null;
    return this.scope;
  }

  setScope(newScope) {
    if (this.scope !== newScope) {
      this.scope = newScope;
      localStorage.setItem('studypulse_scope', newScope);
      this.emit('scopeChanged', newScope);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in listener for ${event}:`, e);
        }
      });
    }
  }

  // Course lookup helper
  getCourseById(courseId) {
    if (!courseId) return null;
    return this.courses.find(c => c.id === Number(courseId)) || null;
  }
}

export const state = new AppState();
