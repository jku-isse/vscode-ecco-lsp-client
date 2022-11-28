import { commands, ExtensionContext, languages, ProgressLocation, Uri, window, workspace } from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import logger from "./logger";
import EccoDocumentAssociationsView from './documentAssociationsView';

export async function checkout(languageClient: LanguageClient): Promise<void> {
    const configuration: string | undefined = await window.showInputBox({
        title: 'ECCO Checkout',
        placeHolder: 'Comma-separated list of feature revisions'
    });

    if (typeof configuration === 'string') {
        logger.debug(`Requested ECCO checkout for: ${configuration}`);

        try {
            await window.withProgress({
                location: ProgressLocation.Notification,
                title: "Please wait until ECCO checkout operation completes"
            }, async () => {
                await languageClient.sendRequest("ecco/checkout", {
                    configuration
                });

                window.showInformationMessage(`Checked out ECCO configuration: ${configuration}`);
            })
        } catch (ex) {
            logger.log('error', `Failed to perform ECCO checkout: ${ex}`);

            window.showErrorMessage(`Failed to perform ECCO checkout: ${ex}`);
        }
    }
}

export async function commit(languageClient: LanguageClient): Promise<void> {
    const message: string | undefined = await window.showInputBox({
        title: 'ECCO commit message',
        placeHolder: 'Describe your commit'
    });

    if (typeof message === 'undefined') {
        return;
    }

    const configuration: string | undefined = await window.showInputBox({
        title: 'ECCO commit configuration',
        placeHolder: 'Leave empty to use the content of .config'
    });

    if (typeof configuration === 'undefined') {
        return;
    }

    logger.debug(`Requested ECCO commit \"${message}\" for configuration \"${configuration}\"`);

    try {
        await window.withProgress({
            location: ProgressLocation.Notification,
            title: "Please wait until ECCO commit operation completes"
        }, async () => {
            const response: any = await languageClient.sendRequest("ecco/commit", {
                configuration,
                message
            });
    
            logger.debug(`Commit response: ${JSON.stringify(response)}`);
        });

        commands.executeCommand('workbench.action.reloadWindow');
    } catch (ex) {
        logger.log('error', `Failed to perform ECCO commit: ${ex}`);

        window.showErrorMessage(`Failed to perform ECCO commit: ${ex}`);
    }
}

export async function repositoryInfo(): Promise<void> {    
    const uri = Uri.parse('ecco-info:ECCO repository info');
    const doc = await workspace.openTextDocument(uri);
    await window.showTextDocument(doc, { preview: false });
}

export async function openAssociationsView(context: ExtensionContext, languageClient: LanguageClient): Promise<void> {
    if (window.activeTextEditor) {
        const view = new EccoDocumentAssociationsView(context, languageClient);
        await view.update(window.activeTextEditor?.document);
    }
}
