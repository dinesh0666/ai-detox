"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetoxSessionManager = void 0;
const vscode = __importStar(require("vscode"));
// Settings to forcibly disable AI inline suggestions during a detox session
const AI_BLOCKING_SETTINGS = [
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
    'workbench.action.closeAuxiliaryBar', // right secondary sidebar
    'workbench.action.closeSidebar', // left primary sidebar
    'workbench.action.closePanel', // bottom panel
    'workbench.action.focusActiveEditorGroup', // pull focus back to editor
];
class DetoxSessionManager {
    constructor(context, stats) {
        this.context = context;
        this.stats = stats;
        this.state = { active: false, pausedExtensions: [] };
        this.stateKey = 'aiDetox.session';
        this._onSessionChange = new vscode.EventEmitter();
        this.onSessionChange = this._onSessionChange.event;
    }
    get isActive() { return this.state.active; }
    get currentState() { return { ...this.state }; }
    /** Remaining ms in session, or 0 if not active */
    get remainingMs() {
        if (!this.state.active || !this.state.startTime || !this.state.durationMs) {
            return 0;
        }
        const elapsed = Date.now() - this.state.startTime;
        return Math.max(0, this.state.durationMs - elapsed);
    }
    async startSession(minutes) {
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
        vscode.window.showInformationMessage(`🧘 AI Detox started for ${minutes} min. AI suggestions are now blocked.`);
    }
    async stopSession(completed) {
        if (!this.state.active) {
            return;
        }
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
    async restoreSession() {
        const saved = this.context.globalState.get(this.stateKey);
        if (!saved?.active || !saved.startTime || !saved.durationMs) {
            return;
        }
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
    _startChatBlocker() {
        // Immediately close all AI chat panels, then re-check every 3 seconds
        const enforce = async () => {
            for (const cmd of CLOSE_CHAT_COMMANDS) {
                try {
                    await vscode.commands.executeCommand(cmd);
                }
                catch { /* not available */ }
            }
        };
        enforce();
        this.chatBlocker = setInterval(enforce, 3000);
    }
    async _applyAIBlockingSettings() {
        for (const { section, key, offValue } of AI_BLOCKING_SETTINGS) {
            for (const target of BLOCKING_TARGETS) {
                try {
                    await vscode.workspace.getConfiguration(section).update(key, offValue, target);
                }
                catch {
                    // Setting may not exist if the extension isn't installed
                }
            }
        }
    }
    async _restoreAISettings() {
        for (const { section, key } of AI_BLOCKING_SETTINGS) {
            for (const target of BLOCKING_TARGETS) {
                try {
                    // undefined removes the override, restoring the extension's own default
                    await vscode.workspace.getConfiguration(section).update(key, undefined, target);
                }
                catch {
                    // Best-effort
                }
            }
        }
    }
    _scheduleEnd() {
        clearTimeout(this.timer);
        const remaining = this.remainingMs;
        if (remaining <= 0) {
            this.stopSession(true);
            return;
        }
        this.timer = setTimeout(() => this.stopSession(true), remaining);
    }
    async _persist() {
        await this.context.globalState.update(this.stateKey, this.state);
    }
    dispose() {
        clearTimeout(this.timer);
        clearInterval(this.chatBlocker);
        this._onSessionChange.dispose();
    }
}
exports.DetoxSessionManager = DetoxSessionManager;
//# sourceMappingURL=detoxSessionManager.js.map