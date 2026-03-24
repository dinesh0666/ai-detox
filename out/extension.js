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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const detoxSessionManager_1 = require("./detoxSessionManager");
const statsTracker_1 = require("./statsTracker");
const dashboardPanel_1 = require("./dashboardPanel");
const statusBarController_1 = require("./statusBarController");
let sessionManager;
let statsTracker;
let statusBar;
function activate(context) {
    console.log('AI Detox extension activated');
    statsTracker = new statsTracker_1.StatsTracker(context);
    sessionManager = new detoxSessionManager_1.DetoxSessionManager(context, statsTracker);
    statusBar = new statusBarController_1.StatusBarController(sessionManager);
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('aiDetox.startSession', async () => {
        const config = vscode.workspace.getConfiguration('aiDetox');
        const defaultDuration = config.get('defaultDurationMinutes', 60);
        const input = await vscode.window.showInputBox({
            prompt: 'Detox session duration (minutes)',
            value: String(defaultDuration),
            validateInput: (v) => isNaN(Number(v)) || Number(v) <= 0 ? 'Enter a valid number' : null,
        });
        if (!input) {
            return;
        }
        const minutes = parseInt(input, 10);
        await sessionManager.startSession(minutes);
        statusBar.refresh();
    }), vscode.commands.registerCommand('aiDetox.stopSession', async () => {
        const confirmed = await vscode.window.showWarningMessage('Stop your detox session early?', { modal: true }, 'Stop Session');
        if (confirmed === 'Stop Session') {
            await sessionManager.stopSession(false);
            statusBar.refresh();
        }
    }), vscode.commands.registerCommand('aiDetox.openDashboard', () => {
        dashboardPanel_1.DashboardPanel.createOrShow(context, sessionManager, statsTracker);
    }));
    // Restore any active session that survived a VS Code restart
    sessionManager.restoreSession().then(() => statusBar.refresh());
    context.subscriptions.push(statusBar);
}
function deactivate() {
    sessionManager?.dispose();
    statusBar?.dispose();
}
//# sourceMappingURL=extension.js.map