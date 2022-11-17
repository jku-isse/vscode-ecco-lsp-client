import { features } from "process";
import { EventEmitter, TextDocumentContentProvider, Uri, window } from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import logger from "./logger";

interface CommitInfo {
    id: string;
    message: string;
    configuration: string;
    timestamp: number;
}

interface FeatureInfo {
    id: string;
    name: string;
    description: string;
    revisions: string[];
}

interface InfoResponse {
    baseDir: string;
    configuration: string;
    commits: CommitInfo[];
    features: FeatureInfo[];
};

export class EccoInfoDocumentContentProvider implements TextDocumentContentProvider {
    onDidChangeEmitter = new EventEmitter<Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    private languageClient: LanguageClient;

    public constructor(languageClient: LanguageClient) {
        this.languageClient = languageClient;
    }

    public async provideTextDocumentContent(_: Uri): Promise<string | null> {
        try {
            const response: InfoResponse = await this.languageClient.sendRequest('ecco/info', {});

            return `Base directory: ${response.baseDir}\n` +
                   `Current configuration: ${response.configuration}\n` +
                   'Commits:\n' +
                    response.commits
                        .map(commit => `\t* ${commit.message}\n` +
                                       `\t  Identifier: ${commit.id}\n` +
                                       `\t  Configuration: ${commit.configuration}\n` +
                                       `\t  Date: ${new Date(commit.timestamp).toISOString()}`)
                        .join('\n') + '\n' +
                    'Features:\n' +
                    response.features
                        .map(feature => `\t* ${feature.name}\n` +
                                        `\t  Identifier: ${feature.id}\n` +
                                        `\t  Description: ${feature.description}\n` +
                                        `\t  Revisions: ${feature.revisions.join(', ')}`)
                        .join('\n');
            // return JSON.stringify(response, null, 2);
        } catch (ex) {
            logger.log('error', `Failed to perform ECCO commit: ${ex}`);
    
            await window.showErrorMessage(`Failed to perform ECCO commit: ${ex}`);
            return null;
        }
    }
}