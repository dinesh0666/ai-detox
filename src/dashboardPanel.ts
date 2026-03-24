import * as vscode from 'vscode';
import { DetoxSessionManager } from './detoxSessionManager';
import { StatsTracker } from './statsTracker';

export class DashboardPanel {
  static currentPanel?: DashboardPanel;

  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  static createOrShow(
    context: vscode.ExtensionContext,
    session: DetoxSessionManager,
    stats: StatsTracker
  ): void {
    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.panel.reveal();
      DashboardPanel.currentPanel.update(session, stats);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'aiDetoxDashboard',
      'AI Detox Dashboard',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    DashboardPanel.currentPanel = new DashboardPanel(panel, context, session, stats);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    private session: DetoxSessionManager,
    private stats: StatsTracker
  ) {
    this.panel = panel;
    this.update(session, stats);

    panel.onDidDispose(() => {
      DashboardPanel.currentPanel = undefined;
      this.dispose();
    }, null, this.disposables);

    panel.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.command) {
        case 'startSession':
          await vscode.commands.executeCommand('aiDetox.startSession');
          this.update(session, stats);
          break;
        case 'stopSession':
          await vscode.commands.executeCommand('aiDetox.stopSession');
          this.update(session, stats);
          break;
        case 'clearStats':
          stats.clearStats();
          this.update(session, stats);
          break;
      }
    }, null, this.disposables);

    // Auto-refresh while session active
    session.onSessionChange(() => this.update(session, stats));
  }

  update(session: DetoxSessionManager, stats: StatsTracker): void {
    this.panel.webview.html = this.buildHtml(session, stats);
  }

  private buildHtml(session: DetoxSessionManager, stats: StatsTracker): string {
    const s = stats.getStats();
    const hours = Math.floor(s.totalDetoxMs / 3600000);
    const minutes = Math.floor((s.totalDetoxMs % 3600000) / 60000);
    const pct = s.totalSessions > 0
      ? Math.round((s.completedSessions / s.totalSessions) * 100)
      : 0;

    const recentSessions = [...s.sessions].reverse().slice(0, 5).map(sess => {
      const date = new Date(sess.startTime).toLocaleDateString();
      const dur = Math.round(sess.durationMs / 60000);
      const status = sess.completed ? '✅ Complete' : '⏹ Stopped';
      return `<tr><td>${date}</td><td>${dur} min</td><td>${status}</td></tr>`;
    }).join('');

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Detox Dashboard</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--vscode-font-family); background: var(--vscode-editor-background);
         color: var(--vscode-editor-foreground); padding: 28px; max-width: 900px; margin: auto; }
  h1 { font-size: 1.6em; margin-bottom: 4px; }
  h2 { font-size: 1.1em; margin: 24px 0 12px; color: var(--vscode-terminal-ansiGreen); }
  .subtitle { color: var(--vscode-descriptionForeground); margin-bottom: 24px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
  .stat-card { background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border);
               border-radius: 8px; padding: 16px; text-align: center; }
  .stat-num { font-size: 2em; font-weight: bold; color: var(--vscode-terminal-ansiBrightYellow); }
  .stat-label { font-size: 0.75em; color: var(--vscode-descriptionForeground); margin-top: 4px; }
  .session-box { background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border);
                 border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .session-active .session-box { border-color: var(--vscode-terminal-ansiGreen); }
  .big-timer { font-size: 3em; font-weight: bold; font-variant-numeric: tabular-nums;
               color: var(--vscode-terminal-ansiGreen); margin: 8px 0; }
  .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;
         font-size: 0.9em; margin-right: 8px; margin-top: 8px; }
  .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .btn-danger  { background: #a83232; color: #fff; }
  .btn-sm { padding: 4px 10px; font-size: 0.8em;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground); border: none;
            border-radius: 3px; cursor: pointer; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
  th { text-align: left; padding: 8px; border-bottom: 1px solid var(--vscode-input-border);
       color: var(--vscode-descriptionForeground); font-weight: normal; }
  td { padding: 8px; border-bottom: 1px solid var(--vscode-panel-border); }
  tr:hover td { background: var(--vscode-list-hoverBackground); }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 3px; font-size: 0.75em; font-weight: bold; }
  .easy   { background: #1a4a2e; color: #4ec994; }
  .medium { background: #4a3a0a; color: #d4a017; }
  .hard   { background: #4a1a1a; color: #e06c75; }
  .empty-state { color: var(--vscode-descriptionForeground); font-style: italic; padding: 12px 0; }
  .danger-zone { margin-top: 32px; }
  .danger-zone button { background: transparent; border: 1px solid #a83232; color: #e06c75;
                        padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.85em; }
</style>
</head>
<body>
<h1>🧘 AI Detox</h1>
<p class="subtitle">Block AI tools. Build focus. Track your raw coding streak.</p>

<!-- Session control -->
<h2>Session</h2>
<div class="${session.isActive ? 'session-active' : ''}">
  <div class="session-box">
    ${session.isActive
      ? `<div>Session active</div>
         <div class="big-timer" id="timer">--:--</div>
         <button class="btn btn-danger" onclick="stopSession()">⏹ Stop Session</button>`
      : `<div style="color:var(--vscode-descriptionForeground)">No active session</div>
         <button class="btn btn-primary" onclick="startSession()" style="margin-top:12px">▶ Start Detox Session</button>`
    }
  </div>
</div>

<!-- Stats -->
<h2>Your Stats</h2>
<div class="stats-grid">
  <div class="stat-card"><div class="stat-num">${s.currentStreakDays}</div><div class="stat-label">Day streak 🔥</div></div>
  <div class="stat-card"><div class="stat-num">${s.longestStreakDays}</div><div class="stat-label">Longest streak</div></div>
  <div class="stat-card"><div class="stat-num">${hours}h ${minutes}m</div><div class="stat-label">Total detox time</div></div>
  <div class="stat-card"><div class="stat-num">${pct}%</div><div class="stat-label">Completion rate</div></div>
</div>

<!-- Recent sessions -->
<h2>Recent Sessions</h2>
${recentSessions
  ? `<table><thead><tr><th>Date</th><th>Duration</th><th>Status</th></tr></thead><tbody>${recentSessions}</tbody></table>`
  : `<div class="empty-state">No sessions yet. Start your first detox!</div>`
}

<!-- Danger zone -->
<div class="danger-zone">
  <button onclick="clearStats()">🗑 Clear all stats</button>
</div>

<script>
  const vscode = acquireVsCodeApi();
  function startSession()  { vscode.postMessage({ command: 'startSession' }); }
  function stopSession()   { vscode.postMessage({ command: 'stopSession' }); }
  function clearStats()    { vscode.postMessage({ command: 'clearStats' }); }

  ${session.isActive ? `
  const endTs = Date.now() + ${session.remainingMs};
  function tick() {
    const ms = Math.max(0, endTs - Date.now());
    const m = String(Math.floor(ms / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    const el = document.getElementById('timer');
    if (el) el.textContent = m + ':' + s;
    if (ms <= 0) clearInterval(iv);
  }
  const iv = setInterval(tick, 500);
  tick();
  ` : ''}
</script>
</body>
</html>`;
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}
