import * as vscode from 'vscode';
import { DetoxSessionManager } from './detoxSessionManager';

export class StatusBarController implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private ticker?: NodeJS.Timeout;

  constructor(private readonly session: DetoxSessionManager) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 200
    );
    this.item.command = 'aiDetox.openDashboard';
    this.refresh();
    this.item.show();
  }

  refresh(): void {
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
      } else {
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
      }
    };

    tick();
    this.ticker = setInterval(tick, 1000);
  }

  dispose(): void {
    clearInterval(this.ticker);
    this.item.dispose();
  }
}
