import * as vscode from "vscode";
import { DiscoMode } from "./DiscoMode";
import { COMMANDS } from "./constants";

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = "🪩";
  statusBar.tooltip = "Disco: Party Mode";
  statusBar.command = COMMANDS.TOGGLE;
  statusBar.show();

  const disco = DiscoMode.getInstance();

  const toggleCommand = vscode.commands.registerCommand(COMMANDS.TOGGLE, () => {
    disco.toggle(statusBar);
  });

  context.subscriptions.push(toggleCommand, statusBar);
}

export function deactivate(): void {}
