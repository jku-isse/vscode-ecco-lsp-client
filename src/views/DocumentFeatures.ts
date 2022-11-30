import * as vscode from 'vscode';
import { renderDocumentMarkingsAsHtml, FragmentMarkingRendererData } from "./DocumentMarkingRender";
import EccoLanguageClient from "../lsp/EccoLanguageClient";
import { TextDocumentMarking } from '../util/DocumentMarking';

function hashCode(str: string): number {
    let hash: number = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
}

export default class EccoDocumentFeaturesView {
    private languageClient: EccoLanguageClient;
    private view?: vscode.WebviewPanel;

    constructor (languageClient: EccoLanguageClient) {
        this.languageClient = languageClient;
    }

    async update (document: vscode.TextDocument, features: string[] | null) {
        if (!this.view) {
            this.view = vscode.window.createWebviewPanel(
                'eccoDocumentFeatures',
                `ECCO Features: ${document.uri.toString()}`,
                vscode.ViewColumn.Two,
                {}
            );
        }

        const [markings, rendererData] = await this.loadMarkings(document, features);

        this.view.webview.html = await renderDocumentMarkingsAsHtml(document, markings, rendererData);
    }

    protected async loadMarkings(document: vscode.TextDocument, features: string[] | null): Promise<[TextDocumentMarking<string>, Map<string, FragmentMarkingRendererData>]> {
        const response = await this.languageClient.getDocumentFeatures(document.uri.toString(), features);
        const markings = {
            fragments: response.fragments.map(fragment => ({
                range: fragment.range,
                marking: fragment.features.join(', ')
            }))
        };

        const rendererData = new Map();
        response.fragments.forEach(fragment => {
            const key = fragment.features.join(', ');
            if (!rendererData.has(key)) {
                const associationHash = hashCode(key);
                const redColor = (associationHash >> 8) & 0xff;
                const greenColor = (associationHash >> 16) & 0xff;
                const blueColor = (associationHash >> 24) & 0xff;
                const alpha = 0.7;
                const dark = 0.8;
                const color = new vscode.Color(redColor * dark, greenColor * dark, blueColor * dark, alpha);

                rendererData.set(key, {
                    description: key,
                    color
                });
            }
        });

        return [markings, rendererData];
    }
}