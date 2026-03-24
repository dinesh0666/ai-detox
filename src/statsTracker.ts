import * as vscode from 'vscode';

export interface SessionRecord {
  startTime: number;
  durationMs: number;
  completed: boolean;
  extensionsBlocked: number;
}

export interface Stats {
  totalSessions: number;
  completedSessions: number;
  totalDetoxMs: number;
  currentStreakDays: number;
  longestStreakDays: number;
  sessions: SessionRecord[];
}

export class StatsTracker {
  private readonly key = 'aiDetox.stats';

  constructor(private readonly context: vscode.ExtensionContext) {}

  getStats(): Stats {
    return this.context.globalState.get<Stats>(this.key) ?? this._empty();
  }

  recordSession(record: SessionRecord): void {
    const stats = this.getStats();
    stats.sessions.push(record);
    stats.totalSessions++;
    if (record.completed) {
      stats.completedSessions++;
      stats.totalDetoxMs += record.durationMs;
    }
    this._recalcStreaks(stats);
    this.context.globalState.update(this.key, stats);
  }

  clearStats(): void {
    this.context.globalState.update(this.key, this._empty());
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _recalcStreaks(stats: Stats): void {
    const completedDays = new Set(
      stats.sessions
        .filter(s => s.completed)
        .map(s => new Date(s.startTime).toDateString())
    );

    const sorted = Array.from(completedDays).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    let longest = 0;
    let current = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        current = 1;
      } else {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        current = diff === 1 ? current + 1 : 1;
      }
      longest = Math.max(longest, current);
    }

    // Current streak: only valid if last day is today or yesterday
    const lastDay = sorted[sorted.length - 1];
    if (lastDay !== today && lastDay !== yesterday) { current = 0; }

    stats.currentStreakDays = current;
    stats.longestStreakDays = longest;
  }

  private _empty(): Stats {
    return {
      totalSessions: 0,
      completedSessions: 0,
      totalDetoxMs: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
      sessions: [],
    };
  }
}
