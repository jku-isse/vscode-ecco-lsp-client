import logger from './logger';
import { ExtensionContext, window } from "vscode";
import EccoLanguageClient from "./lsp/EccoLanguageClient";
import AbstractCommand from "./commands/AbstractCommand";
import EccoCheckoutOperation from "./commands/Checkout";
import EccoCommitOperation from "./commands/Commit";
import EccoDisplayRepositoryInfo from "./commands/DisplayRepositoryInfo";
import EccoRenderDocumentAssociations from "./commands/RenderDocumentAssociations";
import AbstractProvider from "./providers/AbstractProvider";
import EccoRepositoryInfoProvider from "./providers/RepositoryInfo";
import EccoStatusBarItem from './views/StatusBar';

class EccoClientExtension {

    private context: ExtensionContext;
    private languageClient: EccoLanguageClient;
    private statusBarItem: EccoStatusBarItem;
    private commands: AbstractCommand[];
    private providers: AbstractProvider[];

    public constructor (context: ExtensionContext) {
        this.context = context;
        this.languageClient = new EccoLanguageClient(context);

        this.commands = [
            new EccoCheckoutOperation(this.languageClient),
            new EccoCommitOperation(this.languageClient),
            new EccoDisplayRepositoryInfo(),
            new EccoRenderDocumentAssociations(this.context, this.languageClient)
        ];

        this.providers = [
            new EccoRepositoryInfoProvider(this.languageClient),
            // new EccoDocumentHighlightProvider(this.languageClient)
        ];

		this.statusBarItem = new EccoStatusBarItem();
    }

    public async start(): Promise<void> {
        await this.languageClient.start();
        this.commands.forEach(command =>
            this.context.subscriptions.push(command.registerCommand()));
        this.providers.forEach(provider =>
            this.context.subscriptions.push(provider.registerProvider()));
        this.statusBarItem.show();
    }

    public async stop(): Promise<void> {
        await this.languageClient.stop();
    }

    public getLanguageClient(): EccoLanguageClient {
        return this.languageClient;
    }
}

let client: EccoClientExtension;

export async function activate(context: ExtensionContext) {
	logger.debug('activating');

	try {
		client = new EccoClientExtension(context);
		await client.start();
	} catch (ex) {
        window.showErrorMessage(`Failed to initialize ECCO client extension: ${ex}`);
	}
}

export async function deactivate(): Promise<void> {
	if (client) {
		await client.stop();
	}
}