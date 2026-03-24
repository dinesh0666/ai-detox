import * as vscode from 'vscode';
import { StatsTracker } from './statsTracker';

export interface SessionState {
  active: boolean;
  startTime?: number;    // epoch ms
  durationMs?: number;
  pausedExtensions: string[];
}

// Settings to forcibly disable AI inline suggestions during a detox session
const AI_BLOCKING_SETTINGS: Array<{ section: string; key: string; offValue: unknown; }> = [
  // Copilot inline completions — primary toggle (Copilot 2024+)
  { section: 'github.copilot.editor', key: 'enableAutoCompletions', offValue: false },
  // Copilot per-language enable map (legacy + still respected)
  { section: 'github.copilot', key: 'enable', offValue: { '*': false } },
  { section: 'github.copilot.inlineSuggest', key: 'enable', offValue: false },
  // Copilot Next Edit Suggestions (NES)
  { section: 'github.copilot', key: 'nextEditSuggestions.enabled', offValue: false },
  // Inline chat (Ctrl+I / Cmd+I)
  { section: 'inlineChat', key: 'enabled', offValue: false },
  // VS Code built-in inline suggestions (catches any non-Copilot provider too)
  { section: 'editor', key: 'inlineSuggest.enabled', offValue: false },
  // Copilot Chat command-center button
  { section: 'chat', key: 'commandCenter.enabled', offValue: false },
  // "Generate code (⌘I)" empty-editor ghost hint
  { section: 'workbench.editor', key: 'empty.hint', offValue: 'hidden' },
  // Tabnine
  { section: 'tabnine', key: 'disable', offValue: true },
  // Codeium
  { section: 'codeium', key: 'enableConfig', offValue: { '*': false } },
];

// Configuration targets to write — workspace overrides global, so we must set both
const BLOCKING_TARGETS = [
  vscode.ConfigurationTarget.Global,
  vscode.ConfigurationTarget.Workspace,
];

// Commands that close Copilot Chat wherever it may be docked
const CLOSE_CHAT_COMMANDS = [
  'workbench.action.closeAuxiliaryBar',  // right secondary sidebar
  'workbench.action.closeSidebar',       // left primary sidebar
  'workbench.action.closePanel',         // bottom panel
  'workbench.action.focusActiveEditorGroup', // pull focus back to editor
];

export class DetoxSessionManager implements vscode.Disposable {
  private state: SessionState = { active: false, pausedExtensions: [] };
  private timer?: NodeJS.Timeout;
  private chatBlocker?: NodeJS.Timeout;
  private readonly stateKey = 'aiDetox.session';

  private _onSessionChange = new vscode.EventEmitter<SessionState>();
  readonly onSessionChange = this._onSessionChange.event;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly stats: StatsTracker
  ) {}

  get isActive() { return this.state.active; }
  get currentState() { return { ...this.state }; }

  /** Remaining ms in session, or 0 if not active */
  get remainingMs(): number {
    if (!this.state.active || !this.state.startTime || !this.state.durationMs) { return 0; }
    const elapsed = Date.now() - this.state.startTime;
    return Math.max(0, this.state.durationMs - elapsed);
  }

  async startSession(minutes: number): Promise<void> {
    if (this.state.active) {
      vscode.window.showWarningMessage('AI Detox session already running.');
      return;
    }

    await this._applyAIBlockingSettings();

    this.state = {
      active: true,
      startTime: Date.now(),
      durationMs: minutes * 60 * 1000,
      pausedExtensions: [],
    };

    await this._persist();
    this._scheduleEnd();
    this._startChatBlocker();
    this._onSessionChange.fire(this.currentState);

    vscode.window.showInformationMessage(
      `🧘 AI Detox started for ${minutes} min. AI suggestions are now blocked.`
    );
  }

  async stopSession(completed: boolean): Promise<void> {
    if (!this.state.active) { return; }

    clearTimeout(this.timer);
    clearInterval(this.chatBlocker);
    await this._restoreAISettings();

    const durationMs = this.state.startTime
      ? Date.now() - this.state.startTime
      : 0;

    this.stats.recordSession({
      startTime: this.state.startTime ?? Date.now(),
      durationMs,
      completed,
      extensionsBlocked: AI_BLOCKING_SETTINGS.length,
    });

    this.state = { active: false, pausedExtensions: [] };
    await this._persist();
    this._onSessionChange.fire(this.currentState);

    const msg = completed
      ? '✅ Detox session complete! Raw coding done.'
      : '⏹️ Detox session stopped early.';
    vscode.window.showInformationMessage(msg);
  }

  async restoreSession(): Promise<void> {
    const saved = this.context.globalState.get<SessionState>(this.stateKey);
    if (!saved?.active || !saved.startTime || !saved.durationMs) { return; }

    const elapsed = Date.now() - saved.startTime;
    if (elapsed >= saved.durationMs) {
      // Session would have ended while VS Code was closed — count as complete
      this.state = saved;
      await this.stopSession(true);
      return;
    }

    this.state = saved;
    this._scheduleEnd();
    this._onSessionChange.fire(this.currentState);
    vscode.window.showInformationMessage('AI Detox session restored.');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _startChatBlocker(): void {
    // Immediately close all AI chat panels, then re-check every 3 seconds
    const enforce = async () => {
      for (const cmd of CLOSE_CHAT_COMMANDS) {
        try { await vscode.commands.executeCommand(cmd); } catch { /* not available */ }
      }
    };
    enforce();
    this.chatBlocker = setInterval(enforce, 3000);
  }

  private async _applyAIBlockingSettings(): Promise<void> {
    for (const { section, key, offValue } of AI_BLOCKING_SETTINGS) {
      for (const target of BLOCKING_TARGETS) {
        try {
          await vscode.workspace.getConfiguration(section).update(key, offValue, target);
        } catch {
          // Setting may not exist if the extension isn't installed
        }
      }
    }
  }

  private async _restoreAISettings(): Promise<void> {
    for (const { section, key } of AI_BLOCKING_SETTINGS) {
      for (const target of BLOCKING_TARGETS) {
        try {
          // undefined removes the override, restoring the extension's own default
          await vscode.workspace.getConfiguration(section).update(key, undefined, target);
        } catch {
          // Best-effort
        }
      }
    }
  }

  private _scheduleEnd(): void {
    clearTimeout(this.timer);
    const remaining = this.remainingMs;
    if (remaining <= 0) {
      this.stopSession(true);
      return;
    }
    this.timer = setTimeout(() => this.stopSession(true), remaining);
  }

  private async _persist(): Promise<void> {
    await this.context.globalState.update(this.stateKey, this.state);
  }

  dispose() {
    clearTimeout(this.timer);
    clearInterval(this.chatBlocker);
    this._onSessionChange.dispose();
  }
}
