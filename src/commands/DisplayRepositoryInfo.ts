import AbstractCommand from "./AbstractCommand";
import * as vscode from 'vscode';

export default class EccoDisplayRepositoryInfo extends AbstractCommand {
    constructor () {
        super('eccoExtension.info');
    }

    protected async runCommand(): Promise<void> {
        const uri = vscode.Uri.parse('ecco-info:ECCO repository info');
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
    }
}
