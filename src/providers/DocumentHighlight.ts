import * as vscode from 'vscode';
import { Disposable } from 'vscode-languageclient';
import logger from '../logger';
import EccoLanguageClient from '../lsp/EccoLanguageClient';
import AbstractProvider from './AbstractProvider';

const tokenTypes = ['namespace', 'class', 'enum', 'interface', 'struct', 'typeParameter', 'type', 'parameter', 'variable', 'property',
    'enumMember', 'decorator', 'event', 'function', 'method', 'macro', 'label', 'comment', 'string', 'keyword', 'number',
    'regexp', 'operator'];
const tokenModifiers = ['declaration', 'definition', 'readonly', 'static', 'deprecated', 'abstract', 'async',
    'documentation', 'modification', 'defaultLibrary'];
const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

function hashCode(str: string): number {
    let hash: number = 0;
    for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
    }
    return hash;
}

export default class EccoDocumentHighlightProvider implements AbstractProvider, vscode.DocumentSemanticTokensProvider {
    private languageClient: EccoLanguageClient;

    constructor (languageClient: EccoLanguageClient) {
        this.languageClient = languageClient;
    }

    public registerProvider(): Disposable {
        const selector =  { language: 'lilypond', scheme: 'file' };
        return vscode.languages.registerDocumentSemanticTokensProvider(selector, this, legend);
    }

    public async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
        const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
        const response = await this.languageClient.getDocumentAssociations(document.uri.toString());
        response.fragments.forEach(fragment => {
            if (fragment.association === null) {
                return;
            }
            
            const hash = Math.abs(hashCode(fragment.association.id));
            const tokenType = tokenTypes[hash % tokenTypes.length];
            const tokenModifier = tokenModifiers[hash % tokenModifiers.length];
            try {
                tokensBuilder.push(
                    fragment.range,
                    tokenType,
                    [tokenModifier]
                );
            } catch (ex) {
                logger.error(ex);
            }
        });
        return tokensBuilder.build();
    }
}