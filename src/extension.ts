import * as vscode from 'vscode';
import { DetoxSessionManager } from './detoxSessionManager';
import { StatsTracker } from './statsTracker';
import { DashboardPanel } from './dashboardPanel';
import { StatusBarController } from './statusBarController';

let sessionManager: DetoxSessionManager;
let statsTracker: StatsTracker;
let statusBar: StatusBarController;

export function activate(context: vscode.ExtensionContext) {
  console.log('AI Detox extension activated');

  statsTracker = new StatsTracker(context);
  sessionManager = new DetoxSessionManager(context, statsTracker);
  statusBar = new StatusBarController(sessionManager);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDetox.startSession', async () => {
      const config = vscode.workspace.getConfiguration('aiDetox');
      const defaultDuration = config.get<number>('defaultDurationMinutes', 60);

      const input = await vscode.window.showInputBox({
        prompt: 'Detox session duration (minutes)',
        value: String(defaultDuration),
        validateInput: (v) => isNaN(Number(v)) || Number(v) <= 0 ? 'Enter a valid number' : null,
      });

      if (!input) { return; }
      const minutes = parseInt(input, 10);
      await sessionManager.startSession(minutes);
      statusBar.refresh();
    }),

    vscode.commands.registerCommand('aiDetox.stopSession', async () => {
      const confirmed = await vscode.window.showWarningMessage(
        'Stop your detox session early?',
        { modal: true },
        'Stop Session'
      );
      if (confirmed === 'Stop Session') {
        await sessionManager.stopSession(false);
        statusBar.refresh();
      }
    }),

    vscode.commands.registerCommand('aiDetox.openDashboard', () => {
      DashboardPanel.createOrShow(context, sessionManager, statsTracker);
    })
  );

  // Restore any active session that survived a VS Code restart
  sessionManager.restoreSession().then(() => statusBar.refresh());

  context.subscriptions.push(statusBar);
}

export function deactivate() {
  sessionManager?.dispose();
  statusBar?.dispose();
}
