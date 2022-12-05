import AbstractCommand from "./AbstractCommand";
import * as vscode from 'vscode';
import { showWorkspacePicker } from "../views/WorkspacePicker";

export default class EccoDisplayRepositoryInfo extends AbstractCommand {
    constructor () {
        super('eccoExtension.info');
    }

    protected async runCommand(): Promise<void> {
        const workspaceUri = await showWorkspacePicker('Select ECCO repository');
        if (!workspaceUri) {
            return;
        }

        console.log(`ecco-info:${encodeURIComponent(workspaceUri.path)}`);

        const uri = vscode.Uri.parse(`ecco-info:${encodeURIComponent(workspaceUri.toString())}`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
    }
}
