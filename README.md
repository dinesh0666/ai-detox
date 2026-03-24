# 🧘 Raw Code Focus

> **Block AI tools. Build focus. Track your raw coding streak.**

Raw Code Focus is a VS Code extension that helps you practise coding without AI assistance. Start a timed focus session — Copilot, TabNine, Codeium and other AI completions are automatically disabled for the duration. When time's up, everything is silently restored.

---

## Features

### 🚫 AI Blocking
- Disables **GitHub Copilot** inline completions, Next Edit Suggestions, and inline chat (Ctrl+I / Cmd+I)
- Disables **TabNine**, **Codeium**, and VS Code's built-in inline suggestions
- Hides the "Generate code" empty-editor hint
- Closes Copilot Chat panels automatically and re-checks every 3 seconds
- Settings are written to both Global and Workspace targets so workspace overrides can't bypass the block

### ⏱ Timed Sessions
- Choose any session length — defaults to 60 minutes
- Live countdown in the **status bar** (turns yellow when under 5 minutes)
- Sessions survive VS Code restarts and resume correctly
- Stop early at any time with a confirmation prompt

### 📊 Stats Dashboard
Open the dashboard (`Raw Code Focus: Open Dashboard`) to see:
- Current and longest day streak 🔥
- Total accumulated focus time
- Session completion rate
- Recent session history

---

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Run **`Raw Code Focus: Start Detox Session`** and enter a duration
4. Code without AI — the status bar shows your remaining time
5. Open **`Raw Code Focus: Open Dashboard`** to track your progress

---

## Commands

| Command | Description |
|---|---|
| `Raw Code Focus: Start Detox Session` | Start a session (prompts for duration in minutes) |
| `Raw Code Focus: Stop Detox Session` | End the current session early |
| `Raw Code Focus: Open Dashboard` | Open the stats dashboard |

---

## Configuration

| Setting | Default | Description |
|---|---|---|
| `aiDetox.defaultDurationMinutes` | `60` | Default session length shown in the input prompt |
| `aiDetox.showStatusBar` | `true` | Show the live countdown in the status bar |

---

## How Blocking Works

When a session starts, Raw Code Focus writes the following VS Code settings to both **Global** and **Workspace** configuration targets:

| Setting | Value during session |
|---|---|
| `github.copilot.editor.enableAutoCompletions` | `false` |
| `github.copilot.enable` | `{ "*": false }` |
| `github.copilot.inlineSuggest.enable` | `false` |
| `github.copilot.nextEditSuggestions.enabled` | `false` |
| `inlineChat.enabled` | `false` |
| `editor.inlineSuggest.enabled` | `false` |
| `chat.commandCenter.enabled` | `false` |
| `workbench.editor.empty.hint` | `"hidden"` |
| `tabnine.disable` | `true` |
| `codeium.enableConfig` | `{ "*": false }` |

All settings are restored to their original values when the session ends.

---

## Roadmap
- [ ] Pomodoro-style session scheduler
- [ ] Custom session goals and notes
- [ ] Weekly stats summary notification

---

## License
MIT
