import { ExtensionContext, window } from 'vscode';
import logger from './logger';
import EccoClient from './eccoClient';

let client: EccoClient;

export async function activate(context: ExtensionContext) {
	logger.debug('activating');

	try {
		client = new EccoClient(context);
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