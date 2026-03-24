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
exports.StatusBarController = void 0;
const vscode = __importStar(require("vscode"));
class StatusBarController {
    constructor(session) {
        this.session = session;
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
        this.item.command = 'aiDetox.openDashboard';
        this.refresh();
        this.item.show();
    }
    refresh() {
        clearInterval(this.ticker);
        if (!this.session.isActive) {
            this.item.text = '$(zap) Detox: off';
            this.item.tooltip = 'Click to open AI Detox dashboard';
            this.item.backgroundColor = undefined;
            return;
        }
        const tick = () => {
            const ms = this.session.remainingMs;
            if (ms <= 0) {
                this.item.text = '$(check) Detox: done';
                clearInterval(this.ticker);
                return;
            }
            const mins = Math.floor(ms / 60000);
            const secs = Math.floor((ms % 60000) / 1000);
            this.item.text = `$(shield) Detox: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            this.item.tooltip = 'AI tools disabled — click to open dashboard';
            if (ms < 5 * 60 * 1000) {
                this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            }
            else {
                this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
            }
        };
        tick();
        this.ticker = setInterval(tick, 1000);
    }
    dispose() {
        clearInterval(this.ticker);
        this.item.dispose();
    }
}
exports.StatusBarController = StatusBarController;
//# sourceMappingURL=statusBarController.js.map