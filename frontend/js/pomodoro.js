/**
 * Pomodoro Timer Controller
 * Handles focus sessions, breaks, custom settings, and sound alerts
 */

import { playChime } from './audio.js';

class PomodoroController {
  constructor() {
    // Default settings (in minutes)
    this.settings = {
      work: 25,
      shortBreak: 5,
      longBreak: 15,
      ...JSON.parse(localStorage.getItem('studypulse_pomodoro_settings') || '{}')
    };

    this.mode = 'work'; // 'work' | 'shortBreak' | 'longBreak'
    const initialMins = Number(this.settings[this.mode]) || 25;
    this.timeLeft = initialMins * 60;
    this.totalDuration = this.timeLeft;
    this.isRunning = false;
    this.timerId = null;
    this.completedSessions = Number(localStorage.getItem('studypulse_pomodoro_sessions') || 0);
    this.totalFocusMinutes = Number(localStorage.getItem('studypulse_pomodoro_total_minutes') || 0);

    // Callbacks for UI sync
    this.subscribers = new Set();
  }

  subscribe(cb) {
    this.subscribers.add(cb);
    cb(this.getState());
    return () => this.subscribers.delete(cb);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(cb => {
      try { cb(state); } catch (e) { console.error(e); }
    });
  }

  getState() {
    return {
      mode: this.mode,
      timeLeft: this.timeLeft,
      totalDuration: this.totalDuration,
      isRunning: this.isRunning,
      completedSessions: this.completedSessions,
      totalFocusMinutes: this.totalFocusMinutes,
      formattedTime: this.getFormattedTime(),
      progressPercent: Math.max(0, Math.min(100, ((this.totalDuration - this.timeLeft) / this.totalDuration) * 100))
    };
  }

  getFormattedTime() {
    const minutes = Math.floor(Math.max(0, this.timeLeft) / 60);
    const seconds = Math.floor(Math.max(0, this.timeLeft) % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  start() {
    if (this.isRunning) return;
    if (!this.timeLeft || isNaN(this.timeLeft) || this.timeLeft <= 0) {
      this.reset();
    }
    this.isRunning = true;
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => this.tick(), 1000);
    this.notify();
  }

  pause() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  reset() {
    this.pause();
    const durationMins = Number(this.settings[this.mode]) || 25;
    this.timeLeft = durationMins * 60;
    this.totalDuration = this.timeLeft;
    this.notify();
  }

  finish() {
    this.pause();
    playChime();
    if (this.mode === 'work') {
      this.completedSessions += 1;
      const workMins = Number(this.settings.work) || 25;
      this.totalFocusMinutes += workMins;
      localStorage.setItem('studypulse_pomodoro_sessions', this.completedSessions);
      localStorage.setItem('studypulse_pomodoro_total_minutes', this.totalFocusMinutes);

      // Auto-switch to short break or long break (every 4 sessions)
      if (this.completedSessions % 4 === 0) {
        this.setMode('longBreak');
      } else {
        this.setMode('shortBreak');
      }
    } else {
      // Break finished, return to work
      this.setMode('work');
    }
  }

  tick() {
    if (this.timeLeft > 0) {
      this.timeLeft -= 1;
      this.notify();
    } else {
      this.finish();
    }
  }

  setMode(newMode) {
    if (!['work', 'shortBreak', 'longBreak'].includes(newMode)) return;
    this.pause();
    this.mode = newMode;
    this.timeLeft = this.settings[newMode] * 60;
    this.totalDuration = this.timeLeft;
    this.notify();
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('studypulse_pomodoro_settings', JSON.stringify(this.settings));
    this.reset();
  }
}

export const pomodoro = new PomodoroController();
