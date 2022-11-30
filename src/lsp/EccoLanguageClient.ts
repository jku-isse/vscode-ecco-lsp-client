const path = require('path');
const fs = require('fs');
import { ExtensionContext } from "vscode";
import { LanguageClient, Executable, ServerOptions, LanguageClientOptions } from "vscode-languageclient/node";
import logger from '../logger';
import { EccoDocumentAssociationsResponse } from "./DocumentAssociations";
import { EccoDocumentFeaturesResponse } from "./DocumentFeatures";
import { EccoRepositoryInfoResponse } from "./RepositoryInfo";
import { EccoSettings } from "./Settings";

export default class EccoLanguageClient {
    private logDirectory: string;
    private serverLogFile: string;
    private serverJarFile: string;
    private serverOptions: ServerOptions;
    private languageClientOptions: LanguageClientOptions;
    private languageClient?: LanguageClient;

    private static supportedLanguages: string[] = [
        'plaintext', 'java', 'xml', 'lilypond'
    ];

    constructor (context: ExtensionContext) {
        this.logDirectory = context.logUri.fsPath;
        this.serverLogFile = path.join(this.logDirectory, "ecco-lsp-server.log");
        this.serverJarFile = path.join(context.extensionPath, 'resources', 'ecco-lsp-server.jar');

        const serverExecutable: Executable = {
            command: 'java',
            args: ['-jar', this.serverJarFile],
            options: {
                env: {
                    'ECCO_LSP_SERVER_LOG': this.serverLogFile
                }
            }
        };

        this.serverOptions = {
            run: serverExecutable,
            debug: serverExecutable
        };

        this.languageClientOptions = {
            documentSelector: EccoLanguageClient.supportedLanguages.map(language =>
                    ({ scheme: 'file', language }))
        };
    }

    public async start(): Promise<void> {
        if (this.languageClient) {
            throw new Error('ECCO Language client has already been initialized');
        }
        
        try {
            await fs.promises.mkdir(this.logDirectory, {recursive: true});
        } catch (_) {
            // Ignore errors
        }

        try {
            await fs.promises.access(this.serverJarFile, fs.constants.R_OK);
        } catch (ex: any) {
            throw new Error(`ECCO Language Server JAR file ${this.serverJarFile} does not exist`);
        }

        logger.info(`ECCO Langguage Server JAR file is ${this.serverJarFile}`);
        logger.info(`ECCO Langguage Server log is set up to ${this.serverLogFile}`);


        this.languageClient = new LanguageClient(
            'eccoLspClient',
            'ECCO Language Client',
            this.serverOptions,
            this.languageClientOptions,
            true
        );

        await this.languageClient.start();
    }

    public async stop(): Promise<void> {
        if (this.languageClient) {
            await this.languageClient.stop();
            this.languageClient = undefined;
        }
    }

    public getLanguageClient(): LanguageClient {
        if (this.languageClient) {
            return this.languageClient;
        } else {
            throw new Error('ECCO Language client is not initialized');
        }
    }

    public async commit(configuration: string, message: string): Promise<void> {
        await this.getLanguageClient().sendRequest("ecco/commit", {
            configuration,
            message
        });
    }

    public async checkout(configuration: string) {
        await this.getLanguageClient().sendRequest("ecco/checkout", {
            configuration
        });
    }

    public async getRepositoryInfo(): Promise<EccoRepositoryInfoResponse> {
        return await this.getLanguageClient().sendRequest('ecco/info', {});
    }

    public async getDocumentAssociations(documentUri: string): Promise<EccoDocumentAssociationsResponse> {
        return await this.getLanguageClient().sendRequest('ecco/documentAssociations', {
            documentUri
        });
    }

    public async getDocumentFeatures(documentUri: string, requestedFeatures: string[] | null): Promise<EccoDocumentFeaturesResponse> {
        return await this.getLanguageClient().sendRequest('ecco/documentFeatures', {
            documentUri,
            requestedFeatures
        });
    }

    public async getSettings(): Promise<EccoSettings> {
        return await this.getLanguageClient().sendRequest('ecco/getSettings', {});
    }

    public async updateSettings(settings: EccoSettings): Promise<EccoSettings> {
        return await this.getLanguageClient().sendRequest('ecco/updateSettings', settings);
    }
}