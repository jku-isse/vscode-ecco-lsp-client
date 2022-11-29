import EccoLanguageClient from "../lsp/EccoLanguageClient";
import AbstractCommand from "./AbstractCommand";
import * as vscode from 'vscode';
import logger from '../logger';

export default class EccoCommitOperation extends AbstractCommand {
    private languageClient: EccoLanguageClient;

    constructor (languageClient: EccoLanguageClient) {
        super('eccoExtension.commit');
        this.languageClient = languageClient;
    }

    protected async runCommand(): Promise<void> {
        const message: string | undefined = await vscode.window.showInputBox({
            title: 'ECCO commit message',
            placeHolder: 'Describe your commit'
        });
    
        if (typeof message === 'undefined') {
            return;
        }
    
        const configuration: string | undefined = await vscode.window.showInputBox({
            title: 'ECCO commit configuration',
            placeHolder: 'Leave empty to use the content of .config'
        });
    
        if (typeof configuration === 'undefined') {
            return;
        }
    
        logger.debug(`Requested ECCO commit \"${message}\" for configuration \"${configuration}\"`);
    
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Please wait until ECCO commit operation completes"
            }, async () => {
                await this.languageClient.commit(configuration, message);
            });
    
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        } catch (ex) {
            logger.log('error', `Failed to perform ECCO commit: ${ex}`);
    
            vscode.window.showErrorMessage(`Failed to perform ECCO commit: ${ex}`);
        }
    }
}
