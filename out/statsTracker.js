"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsTracker = void 0;
class StatsTracker {
    constructor(context) {
        this.context = context;
        this.key = 'aiDetox.stats';
    }
    getStats() {
        return this.context.globalState.get(this.key) ?? this._empty();
    }
    recordSession(record) {
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
    clearStats() {
        this.context.globalState.update(this.key, this._empty());
    }
    // ── Private ────────────────────────────────────────────────────────────────
    _recalcStreaks(stats) {
        const completedDays = new Set(stats.sessions
            .filter(s => s.completed)
            .map(s => new Date(s.startTime).toDateString()));
        const sorted = Array.from(completedDays).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        let longest = 0;
        let current = 0;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        for (let i = 0; i < sorted.length; i++) {
            if (i === 0) {
                current = 1;
            }
            else {
                const prev = new Date(sorted[i - 1]);
                const curr = new Date(sorted[i]);
                const diff = (curr.getTime() - prev.getTime()) / 86400000;
                current = diff === 1 ? current + 1 : 1;
            }
            longest = Math.max(longest, current);
        }
        // Current streak: only valid if last day is today or yesterday
        const lastDay = sorted[sorted.length - 1];
        if (lastDay !== today && lastDay !== yesterday) {
            current = 0;
        }
        stats.currentStreakDays = current;
        stats.longestStreakDays = longest;
    }
    _empty() {
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
exports.StatsTracker = StatsTracker;
//# sourceMappingURL=statsTracker.js.map