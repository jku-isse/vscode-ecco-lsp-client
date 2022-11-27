import { commands, ExtensionContext, languages, StatusBarAlignment, StatusBarItem, window, workspace } from "vscode";
import logger from "./logger";
import { LanguageClient } from "vscode-languageclient/node";
import { checkout, commit, repositoryInfo } from "./operations";
import { newEccoLanguageClient } from "./lsp";
import { EccoInfoDocumentContentProvider } from "./infoDocument";
import assert = require("assert");
import EccoHighlightProvider from "./highlightProvider";

class EccoClient {

    private context: ExtensionContext;
    private languageClient?: LanguageClient = undefined;
    private statusBarItem?: StatusBarItem = undefined;

    public constructor (context: ExtensionContext) {
        this.context = context;
    }

    public async start(): Promise<void> {
        await this.startLanguageClient();
        await this.registerCommands();
        await this.setupStatusBar();
        await this.setupInfoDocument();
        await this.setupHighlight();
    }

    public async stop(): Promise<void> {
        if (this.languageClient) {
            await this.languageClient.stop();
        }
    }

    private async startLanguageClient(): Promise<void> {
        this.languageClient = await newEccoLanguageClient(this.context);
        await this.languageClient.start();
    }

    private async registerCommands(): Promise<void> {
        this.context.subscriptions.push(commands.registerCommand('eccoExtension.checkout', this.newOperationHandler(checkout)));
        this.context.subscriptions.push(commands.registerCommand('eccoExtension.commit', this.newOperationHandler(commit)));
        this.context.subscriptions.push(commands.registerCommand('eccoExtension.info', repositoryInfo));
    }

    private newOperationHandler(operation: (languageClient: LanguageClient) => Promise<void>): () => Promise<void> {
        return async () => {
            const languageClient = this.languageClient;
            if (typeof languageClient === 'undefined') {
                logger.error("ECCO client is not running");
            } else {
                await operation(languageClient);
            }
        };
    }

    private async setupStatusBar(): Promise<void> {
        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
        this.statusBarItem.text = 'ECCO';
        this.statusBarItem.command = 'eccoExtension.info';
        this.statusBarItem.show();
    }

    private async setupInfoDocument(): Promise<void> {
        assert(typeof this.languageClient !== 'undefined');
        this.context.subscriptions.push(workspace.registerTextDocumentContentProvider("ecco-info", new EccoInfoDocumentContentProvider(this.languageClient)));
    }

    private async setupHighlight(): Promise<void> {
        assert(typeof this.languageClient !== 'undefined');
        const selector =  { language: 'lilypond', scheme: 'file' };
        languages.registerDocumentSemanticTokensProvider(selector, new EccoHighlightProvider(this.languageClient), EccoHighlightProvider.getLegend());
    }
}

export default EccoClient;