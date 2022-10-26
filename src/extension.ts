import fs = require('fs');
import path = require('path');
import { ExtensionContext } from 'vscode';

import {
	Executable,
	LanguageClient,
	LanguageClientOptions,
	ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;

function setupLogger(context: ExtensionContext): Promise<string> {
	return new Promise(resolve => {
		const logDirectory = context.logUri.fsPath;
		fs.mkdir(logDirectory, { recursive: true }, _ => {
			const serverLogFile = path.join(logDirectory, "ecco-lsp-server.log");
			console.log('ecco-lsp-client: server log is set up to ', serverLogFile);
			resolve(serverLogFile);
		});
	});
}

export async function activate(context: ExtensionContext) {
	console.log('ecco-lsp-client: activating');

	const serverLogFile: string = await setupLogger(context);
	const eccoLspServerJar: string = path.join(context.extensionPath, 'resources', 'ecco-lsp-server.jar');
	console.log('ecco-lsp-client: LSP server JAR file ', eccoLspServerJar);

	const eccoLspServerExecutable: Executable = {
		command: 'java',
		args: ['-jar', eccoLspServerJar, serverLogFile]
	};

	const serverOptions: ServerOptions = {
		run: eccoLspServerExecutable,
		debug: eccoLspServerExecutable
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'plaintext' }]
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