import { DocumentSemanticTokensProvider, Position, ProviderResult, Range, SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend, TextDocument } from 'vscode';
import { CancellationToken } from 'vscode-languageclient';
import { LanguageClient } from 'vscode-languageclient/node';

const tokenTypes = ['namespace', 'class', 'enum', 'interface', 'struct', 'typeParameter', 'type', 'parameter', 'variable', 'property',
    'enumMember', 'decorator', 'event', 'function', 'method', 'macro', 'label', 'comment', 'string', 'keyword', 'number',
    'regexp', 'operator'];
const tokenModifiers = ['declaration', 'definition', 'readonly', 'static', 'deprecated', 'abstract', 'async',
    'documentation', 'modification', 'defaultLibrary'];
const legend = new SemanticTokensLegend(tokenTypes, tokenModifiers);

interface FragmentAssociation {
    range: Range,
    association: string
}

interface DocumentAssociationsResponse {
    fragments: FragmentAssociation[]
}

function hashCode(str: string): number {
    let hash: number = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
}

class EccoHighlightProvider implements DocumentSemanticTokensProvider {
    private languageClient: LanguageClient;

    constructor (languageClient: LanguageClient) {
        this.languageClient = languageClient;
    }

    async provideDocumentSemanticTokens(document: TextDocument, token: CancellationToken): Promise<SemanticTokens> {
        const tokensBuilder = new SemanticTokensBuilder(legend);
        const params = {
            documentUri: document.uri.toString(),
            documentText: document.getText(),
            collapse: true
        };
        const response: DocumentAssociationsResponse = await this.languageClient.sendRequest('ecco/documentAssociations', params);
        response.fragments.forEach(fragment => {
            const hash = Math.abs(hashCode(fragment.association));
            const tokenType = tokenTypes[hash % tokenTypes.length];
            const tokenModifier = tokenModifiers[hash % tokenModifiers.length];
            try {
                tokensBuilder.push(
                    fragment.range,
                    tokenType,
                    [tokenModifier]
                );
            } catch (ex) {
                console.error(ex);
            }
        });
        return tokensBuilder.build();
    }
    
    static getLegend(): SemanticTokensLegend {
        return legend;
    }
}

export default EccoHighlightProvider;
