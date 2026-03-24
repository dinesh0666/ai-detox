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
exports.ChallengeManager = void 0;
const vscode = __importStar(require("vscode"));
const challenges_1 = require("./challenges");
class ChallengeManager {
    constructor(context, stats) {
        this.context = context;
        this.stats = stats;
    }
    async pickAndStartChallenge() {
        const items = challenges_1.CHALLENGES.map(c => ({
            label: c.title,
            description: `${c.difficulty} · ${c.estimatedMinutes} min`,
            detail: c.description,
            challenge: c,
        }));
        const picked = await vscode.window.showQuickPick(items, {
            placeHolder: 'Pick a challenge (no AI allowed 😤)',
            matchOnDetail: true,
        });
        if (!picked) {
            return;
        }
        this.startChallenge(picked.challenge);
    }
    startChallenge(challenge) {
        this.activeChallenge = challenge;
        this.challengeStartTime = Date.now();
        this._openChallengePanel(challenge);
    }
    _openChallengePanel(challenge) {
        this.panel?.dispose();
        this.panel = vscode.window.createWebviewPanel('aiDetoxChallenge', `Challenge: ${challenge.title}`, vscode.ViewColumn.Beside, { enableScripts: true });
        const timeLimitMs = challenge.estimatedMinutes * 60 * 1000;
        this.panel.webview.html = this._buildChallengeHtml(challenge, timeLimitMs);
        this.panel.webview.onDidReceiveMessage((msg) => {
            if (msg.command === 'submit') {
                this._handleSubmit(challenge, msg.code);
            }
            else if (msg.command === 'giveUp') {
                this._finishChallenge(false, challenge);
            }
        });
        this.panel.onDidDispose(() => {
            clearInterval(this.timerInterval);
        });
    }
    _handleSubmit(challenge, code) {
        const durationMs = Date.now() - (this.challengeStartTime ?? Date.now());
        // In a real extension, run test cases here.
        // For now we trust the self-report and show a review panel.
        const passed = code.trim().length > 50; // naive check — replace with actual test runner
        this.stats.recordChallenge({
            title: challenge.title,
            completedAt: Date.now(),
            durationMs,
            passed,
        });
        clearInterval(this.timerInterval);
        this.panel?.dispose();
        const msg = passed
            ? `✅ Challenge "${challenge.title}" submitted! Time: ${Math.round(durationMs / 1000)}s`
            : `😬 Looks incomplete, but logged. Keep practicing!`;
        vscode.window.showInformationMessage(msg);
    }
    _finishChallenge(passed, challenge) {
        const durationMs = Date.now() - (this.challengeStartTime ?? Date.now());
        this.stats.recordChallenge({ title: challenge.title, completedAt: Date.now(), durationMs, passed });
        clearInterval(this.timerInterval);
        this.panel?.dispose();
    }
    _buildChallengeHtml(challenge, timeLimitMs) {
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Challenge</title>
<style>
  body { font-family: var(--vscode-font-family); background: var(--vscode-editor-background);
         color: var(--vscode-editor-foreground); padding: 20px; margin: 0; }
  h1 { color: var(--vscode-terminal-ansiGreen); font-size: 1.2em; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px;
           font-size: 0.75em; font-weight: bold; margin-left: 8px; }
  .easy { background: #1a4a2e; color: #4ec994; }
  .medium { background: #4a3a0a; color: #d4a017; }
  .hard { background: #4a1a1a; color: #e06c75; }
  .timer { font-size: 2em; font-weight: bold; color: var(--vscode-terminal-ansiBrightYellow);
           margin: 10px 0; font-variant-numeric: tabular-nums; }
  .timer.warning { color: var(--vscode-terminal-ansiRed); }
  pre { background: var(--vscode-input-background); padding: 12px; border-radius: 4px;
        white-space: pre-wrap; font-size: 0.9em; border: 1px solid var(--vscode-input-border); }
  textarea { width: 100%; height: 300px; background: var(--vscode-input-background);
             color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);
             padding: 10px; font-family: var(--vscode-editor-font-family);
             font-size: 13px; border-radius: 4px; resize: vertical; box-sizing: border-box; }
  .btn { padding: 8px 18px; border: none; border-radius: 4px; cursor: pointer;
         font-size: 0.9em; margin-right: 8px; margin-top: 10px; }
  .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .btn-secondary { background: var(--vscode-button-secondaryBackground);
                   color: var(--vscode-button-secondaryForeground); }
  .hint { font-size: 0.8em; color: var(--vscode-descriptionForeground); margin-top: 6px; }
  .section-label { font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.05em;
                   color: var(--vscode-descriptionForeground); margin-top: 16px; }
</style>
</head>
<body>
<h1>${challenge.title} <span class="badge ${challenge.difficulty.toLowerCase()}">${challenge.difficulty}</span></h1>
<div class="timer" id="timer">--:--</div>
<div class="section-label">Problem</div>
<pre>${challenge.prompt}</pre>
<div class="section-label">Your Solution</div>
<textarea id="code" placeholder="Write your solution here..."></textarea>
<div class="hint">🚫 No AI. No Copilot. Just you.</div>
<br>
<button class="btn btn-primary" onclick="submit()">Submit Solution</button>
<button class="btn btn-secondary" onclick="giveUp()">Give Up</button>

<script>
  const vscode = acquireVsCodeApi();
  const limitMs = ${timeLimitMs};
  const startTs = Date.now();
  const timerEl = document.getElementById('timer');

  function fmt(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return m + ':' + s;
  }

  function tick() {
    const elapsed = Date.now() - startTs;
    const remaining = limitMs - elapsed;
    timerEl.textContent = fmt(remaining);
    if (remaining <= 60000) { timerEl.classList.add('warning'); }
    if (remaining <= 0) { timerEl.textContent = '00:00'; clearInterval(interval); }
  }

  const interval = setInterval(tick, 500);
  tick();

  function submit() {
    vscode.postMessage({ command: 'submit', code: document.getElementById('code').value });
  }
  function giveUp() {
    vscode.postMessage({ command: 'giveUp' });
  }
</script>
</body>
</html>`;
    }
}
exports.ChallengeManager = ChallengeManager;
//# sourceMappingURL=challengeManager.js.map