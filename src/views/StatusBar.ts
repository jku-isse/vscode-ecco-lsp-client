import * as vscode from 'vscode';

export default class EccoStatusBarItem {
    private statusBarItem: vscode.StatusBarItem;

    constructor () {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.statusBarItem.text = 'ECCO';
        this.statusBarItem.command = 'eccoExtension.info';
    }

    show () {
        this.statusBarItem.show();
    }
}