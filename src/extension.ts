import fs = require('fs');
import path = require('path');
import { ExtensionContext } from 'vscode';
import logger from './logger';

import {
	Executable,
	LanguageClient,
	LanguageClientOptions,
	ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;

async function setupServerLog(context: ExtensionContext): Promise<string> {
	const logDirectory = context.logUri.fsPath;
	const serverLogFile = path.join(logDirectory, "ecco-lsp-server.log");

	try {
		await fs.promises.mkdir(logDirectory, {recursive: true});
	} catch (_) {
		// Ignore errors
	}

	return serverLogFile;
}

export async function activate(context: ExtensionContext) {
	logger.debug('activating');

	const serverLogFile: string = await setupServerLog(context);
	const eccoLspServerJar: string = path.join(context.extensionPath, 'resources', 'ecco-lsp-server.jar');

	try {
		await fs.promises.access(eccoLspServerJar, fs.constants.R_OK);
	} catch (ex: any) {
		logger.emerg(`server JAR file ${eccoLspServerJar} is not accessible: ${ex.message}`);
		return;
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
			{ scheme: 'file', language: 'xml' }
		]
	};

	client = new LanguageClient(
		'eccoLspClient',
		'Client for ECCO language server',
		serverOptions,
		clientOptions
	);

	await client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}