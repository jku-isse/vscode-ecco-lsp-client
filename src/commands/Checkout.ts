import EccoLanguageClient from "../lsp/EccoLanguageClient";
import AbstractCommand from "./AbstractCommand";
import * as vscode from 'vscode';
import logger from '../logger';

export default class EccoCheckoutOperation extends AbstractCommand {
    private languageClient: EccoLanguageClient;

    constructor (languageClient: EccoLanguageClient) {
        super('eccoExtension.checkout');
        this.languageClient = languageClient;
    }

    protected async runCommand(): Promise<void> {
        const configuration: string | undefined = await vscode.window.showInputBox({
            title: 'ECCO Checkout',
            placeHolder: 'Comma-separated list of feature revisions'
        });
    
        if (typeof configuration === 'string') {
            logger.debug(`Requested ECCO checkout for: ${configuration}`);
    
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Please wait until ECCO checkout operation completes"
                }, async () => {
                    await this.languageClient.checkout(configuration);
    
                    vscode.window.showInformationMessage(`Checked out ECCO configuration: ${configuration}`);
                })
            } catch (ex) {
                logger.log('error', `Failed to perform ECCO checkout: ${ex}`);
    
                vscode.window.showErrorMessage(`Failed to perform ECCO checkout: ${ex}`);
            }
        }
    }
}
