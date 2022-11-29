import { Disposable } from "vscode-languageclient";
import AbstractProvider from "./AbstractProvider";
import * as vscode from 'vscode';
import EccoLanguageClient from "../lsp/EccoLanguageClient";
import logger from "../logger";

export default class EccoRepositoryInfoProvider implements AbstractProvider, vscode.TextDocumentContentProvider {
    private languageClient: EccoLanguageClient;

    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    constructor (languageClient: EccoLanguageClient) {
        this.languageClient = languageClient;
    }

    public registerProvider(): Disposable {
        return vscode.workspace.registerTextDocumentContentProvider("ecco-info", this);
    }

    public async provideTextDocumentContent(_: vscode.Uri): Promise<string | null> {
        try {
            const repoInfo = await this.languageClient.getRepositoryInfo();

            return `Base directory: ${repoInfo.baseDir}\n` +
                   `Current configuration: ${repoInfo.configuration}\n` +
                   'Commits:\n' +
                   repoInfo.commits
                        .map(commit => `\t* ${commit.message}\n` +
                                       `\t  Identifier: ${commit.id}\n` +
                                       `\t  Configuration: ${commit.configuration}\n` +
                                       `\t  Date: ${new Date(commit.timestamp).toISOString()}`)
                        .join('\n') + '\n' +
                    'Features:\n' +
                    repoInfo.features
                        .map(feature => `\t* ${feature.name}\n` +
                                        `\t  Identifier: ${feature.id}\n` +
                                        `\t  Description: ${feature.description}\n` +
                                        `\t  Revisions: ${feature.revisions.join(', ')}`)
                        .join('\n');
            // return JSON.stringify(response, null, 2);
        } catch (ex) {
            logger.log('error', `Failed to perform ECCO commit: ${ex}`);
    
            await vscode.window.showErrorMessage(`Failed to perform ECCO commit: ${ex}`);
            return null;
        }
    }
}
