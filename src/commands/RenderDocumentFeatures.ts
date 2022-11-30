import AbstractCommand from "./AbstractCommand";
import * as vscode from 'vscode';
import EccoLanguageClient from "../lsp/EccoLanguageClient";
import EccoDocumentFeaturesView from "../views/DocumentFeatures";
import { showWorkspacePicker } from "../views/WorkspacePicker";

export default class EccoRenderDocumentFeatures extends AbstractCommand {
    private context: vscode.ExtensionContext;
    private languageClient: EccoLanguageClient;

    constructor (context: vscode.ExtensionContext, languageClient: EccoLanguageClient) {
        super('eccoExtension.openFeaturesView');

        this.context = context;
        this.languageClient = languageClient;
    }

    protected async runCommand(): Promise<void> {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showErrorMessage("Select active editor to perform feature rendering on");
            return;
        }
        const document = vscode.window.activeTextEditor.document;

        const repoInfo = await this.languageClient.getRepositoryInfo(document.uri.toString());

        const featuresPick = vscode.window.createQuickPick();
        featuresPick.items = repoInfo.features
            .map(feature => ({ label: feature.name }));
        featuresPick.canSelectMany = true;
        featuresPick.selectedItems = featuresPick.items;
        featuresPick.title = 'Select document features for rendering';

        const disposables: vscode.Disposable[] = [];
        disposables.push(featuresPick.onDidAccept(() => {
            const features = featuresPick.selectedItems.map(item => item.label);
            disposables.forEach(disposable => disposable.dispose());
            featuresPick.dispose();

            const view = new EccoDocumentFeaturesView(this.languageClient);
            view.update(document, features);
        }));

        disposables.push(featuresPick.onDidHide(() => {
            disposables.forEach(disposable => disposable.dispose());
            featuresPick.dispose();
        }));

        featuresPick.show();
    }
}
