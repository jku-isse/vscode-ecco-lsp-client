import path = require("path");
import fs = require("fs");
import { ExtensionContext } from "vscode";
import logger from "./logger";
import { Executable, LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";

export async function newEccoLanguageClient(context: ExtensionContext): Promise<LanguageClient> {
    const logDirectory = context.logUri.fsPath;
    const serverLogFile = path.join(logDirectory, "ecco-lsp-server.log");
    try {
        await fs.promises.mkdir(logDirectory, {recursive: true});
    } catch (_) {
        // Ignore errors
    }

    const eccoLspServerJar: string = path.join(context.extensionPath, 'resources', 'ecco-lsp-server.jar');
    try {
        await fs.promises.access(eccoLspServerJar, fs.constants.R_OK);
    } catch (ex: any) {
        logger.emerg(`server JAR file ${eccoLspServerJar} is not accessible: ${ex.message}`);
        throw new Error(`${eccoLspServerJar} does not exist`);
    }


    logger.info(`server JAR file is ${eccoLspServerJar}`);
    logger.info(`server log is set up to ${serverLogFile}`);

    const eccoLspServerExecutable: Executable = {
        command: 'java',
        args: ['-jar', eccoLspServerJar],
        options: {
            env: {
                'ECCO_LSP_SERVER_LOG': serverLogFile
            }
        }
    };

    const serverOptions: ServerOptions = {
        run: eccoLspServerExecutable,
        debug: eccoLspServerExecutable
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'plaintext' },
            { scheme: 'file', language: 'java' },
            { scheme: 'file', language: 'xml' },
            { scheme: 'file', language: 'lilypond' }
        ]		
    };

    return new LanguageClient(
        'eccoLspClient',
        'Client for ECCO language server',
        serverOptions,
        clientOptions,
        true
    );
}