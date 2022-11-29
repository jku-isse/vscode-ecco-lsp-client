import AbstractCommand from "./AbstractCommand";
import * as vscode from 'vscode';
import EccoLanguageClient from "../lsp/EccoLanguageClient";
import EccoDocumentAssociationsView from '../views/DocumentAssociations';

export default class EccoRenderDocumentAssociations extends AbstractCommand {
    private context: vscode.ExtensionContext;
    private languageClient: EccoLanguageClient;

    constructor (context: vscode.ExtensionContext, languageClient: EccoLanguageClient) {
        super('eccoExtension.openAssociationsView');

        this.context = context;
        this.languageClient = languageClient;
    }

    protected async runCommand(): Promise<void> {
        if (vscode.window.activeTextEditor) {
            const view = new EccoDocumentAssociationsView(this.languageClient);
            await view.update(vscode.window.activeTextEditor?.document);
        }
    }
}
