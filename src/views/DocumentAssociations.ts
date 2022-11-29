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

export default class EccoDocumentAssociationsView {
    private languageClient: EccoLanguageClient;
    private view?: vscode.WebviewPanel;

    constructor (languageClient: EccoLanguageClient) {
        this.languageClient = languageClient;
    }

    async update (document: vscode.TextDocument) {
        if (!this.view) {
            this.view = vscode.window.createWebviewPanel(
                'eccoDocumentAssociations',
                `ECCO Associations: ${document.uri.toString()}`,
                vscode.ViewColumn.Two,
                {}
            );
        }

        const [markings, rendererData] = await this.loadMarkings(document);

        this.view.webview.html = await renderDocumentMarkingsAsHtml(document, markings, rendererData);
    }

    protected async loadMarkings(document: vscode.TextDocument): Promise<[TextDocumentMarking<string>, Map<string, FragmentMarkingRendererData>]> {
        const response = await this.languageClient.getDocumentAssociations(document.uri.toString(), document.getText());
        const markings = {
            fragments: response.fragments.map(fragment => ({
                range: fragment.range,
                marking: fragment.association
            }))
        };

        const rendererData = new Map();
        response.fragments.forEach(fragment => {
            if (fragment.association !== null && !rendererData.has(fragment.association)) {
                const associationHash = hashCode(fragment.association);
                const redColor = (associationHash >> 8) & 0xff;
                const greenColor = (associationHash >> 16) & 0xff;
                const blueColor = (associationHash >> 24) & 0xff;
                const alpha = 0.7;
                const color = new vscode.Color(redColor, greenColor, blueColor, alpha);

                rendererData.set(fragment.association, {
                    description: fragment.associationCondition,
                    color
                });
            }
        });

        return [markings, rendererData];
    }
}