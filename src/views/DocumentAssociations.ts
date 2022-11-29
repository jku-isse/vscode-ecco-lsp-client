import assert = require('assert');
import { Color, ExtensionContext, Position, Range, TextDocument, TextLine, ViewColumn, WebviewPanel, window } from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { EccoDocumentAssociationsRequest, EccoDocumentAssociationsResponse, EccoDocumentFragmentAssociation } from '../lsp/DocumentAssociations';
import EccoLanguageClient from '../lsp/EccoLanguageClient';

interface ExtendedDocumentFragmentAssociation extends EccoDocumentFragmentAssociation {
    content: string
};

interface TextLineFragmentAssociations {
    lineNumber: number,
    fragments: ExtendedDocumentFragmentAssociation[]
}

interface TextDocumentFragmentAssociations {
    lines: TextLineFragmentAssociations[]
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

export default class EccoDocumentAssociationsView {
    private languageClient: EccoLanguageClient;
    private view?: WebviewPanel;

    constructor (languageClient: EccoLanguageClient) {
        this.languageClient = languageClient;
    }

    async update (document: TextDocument) {
        if (!this.view) {
            this.view = window.createWebviewPanel(
                'eccoDocumentAssociations',
                `ECCO Associations: ${document.uri.toString()}`,
                ViewColumn.Two,
                {}
            );
        }

        await this.updateWebviewContent(document);
    }

    private async updateWebviewContent (document: TextDocument) {
        assert(this.view);
        
        const response: EccoDocumentAssociationsResponse = await this.languageClient.getDocumentAssociations(document.uri.toString(), document.getText());

        const htmlHeader = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        .document-associations {
                            display: flex,
                            flex-direction: column,
                            flex-wrap: nowrap
                            font-family: monospace;
                        }

                        .document-association-line {
                            display: flex,
                            flex-direction: row,
                            flex-wrap: nowrap
                        }

                        .document-association-fragment {
                            white-space: pre;
                            display: inline-block;
                        }

                        .color-table {
                            width: 95vw;
                            margin-top: 10px;
                        }

                        .color-table th,
                        .color-table td {
                            border: 1px solid;
                        }

                        .association-condition-col {
                            width: 80%
                        }

                        .association-color-col {
                            width: 20%
                        }
                    </style>
                </head>
                <body>`;

        const htmlFooter = `
                </body>
            </html>`;

        let htmlContent = '';
        try {
            const documentAssociations = response.fragments.map((fragment: EccoDocumentFragmentAssociation): ExtendedDocumentFragmentAssociation => {
                if (fragment.range.start.line !== fragment.range.end.line) {
                    console.log(fragment.range);
                    throw new Error('Expected every fragment returned by ECCO LSP document association service to cover only a single line');
                }

                const textLine = document.lineAt(fragment.range.start.line);
                const range = new Range(
                    new Position(fragment.range.start.line, Math.min(fragment.range.start.character, textLine.range.end.character)),
                    new Position(fragment.range.end.line, Math.min(fragment.range.end.character, textLine.range.end.character))
                );
                const fragmentText: string = document.getText(range);
                return Object.assign({}, fragment, {
                    content: fragmentText,
                    range
                });
            }).reduce((documentAssociations: TextDocumentFragmentAssociations, fragmentAssociation: ExtendedDocumentFragmentAssociation): TextDocumentFragmentAssociations => {
                const fragmentLineNumber = fragmentAssociation.range.start.line;

                // Fill in skipped lines
                for (let currentLine = documentAssociations.lines.length; currentLine < fragmentLineNumber; currentLine++) {
                    const line = document.lineAt(currentLine - 1);
                    documentAssociations.lines.push({
                        fragments: [{
                            association: null,
                            associationCondition: null,
                            range: line.range,
                            content: line.text
                        }],
                        lineNumber: currentLine - 1
                    });
                }

                // Add current line if necessary
                const line = document.lineAt(fragmentLineNumber);
                if (documentAssociations.lines.length < fragmentLineNumber + 1) {
                    documentAssociations.lines.push({
                        fragments: [],
                        lineNumber: fragmentLineNumber
                    });

                    if (fragmentAssociation.range.start.character > 0) {
                        documentAssociations.lines[fragmentLineNumber].fragments.push({
                            association: null,
                            associationCondition: null,
                            range: new Range(new Position(fragmentLineNumber - 1, 0), new Position(fragmentLineNumber - 1, fragmentAssociation.range.start.character - 1)),
                            content: line.text.substring(0, fragmentAssociation.range.start.character - 1)
                        })
                    }
                }

                const currentLineAssociations = documentAssociations.lines[fragmentLineNumber];
                if (fragmentAssociation.range.start.character > 0) {
                    const lastFragment = currentLineAssociations.fragments[currentLineAssociations.fragments.length - 1];
                    if (lastFragment.range.end.character + 1 < fragmentAssociation.range.start.character) {
                        currentLineAssociations.fragments.push({
                            association: null,
                            associationCondition: null,
                            range: new Range(new Position(fragmentLineNumber, lastFragment.range.end.character), new Position(fragmentLineNumber, fragmentAssociation.range.start.character - 1)),
                            content: line.text.substring(lastFragment.range.end.character, fragmentAssociation.range.start.character - 1)
                        });
                    }
                }

                currentLineAssociations.fragments.push(fragmentAssociation);

                return documentAssociations;
            }, { lines: [] });

            const associationDescriptions = new Map();
            htmlContent = `<div class="document-associations">` +
                documentAssociations.lines
                    .map(line =>
                        line.fragments
                            .map(fragment => {
                                let cssProps = '';
                                if (fragment.association !== null) {
                                    let associationDescription = associationDescriptions.get(fragment.association);
                                    let color: Color = new Color(1, 1, 1, 1);
                                    if (!associationDescription) {
                                        const associationHash = hashCode(fragment.association);
                                        const redColor = (associationHash >> 8) & 0xff;
                                        const greenColor = (associationHash >> 16) & 0xff;
                                        const blueColor = (associationHash >> 24) & 0xff;
                                        const alpha = 0.7;
                                        color = new Color(redColor, greenColor, blueColor, alpha);
                                        associationDescriptions.set(fragment.association, {
                                            color,
                                            description: fragment.associationCondition
                                        });
                                    } else {
                                        color = associationDescription.color;
                                    }
                                    cssProps = `background-color: rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
                                }
                                return `<div class="document-association-fragment" style="${cssProps}">${fragment.content}</div>`;
                            })
                            .join(''))
                    .map(line => `<div class="document-association-line">${line}</div>`)
                    .join('') +
                    '</div>';
            
            let colorTable = `
                <table class="color-table">
                    <thead>
                        <th class="association-condition-col">Association</th>
                        <th class="association-color-col">Color</th>
                    </thead>
                    <tbody>`;
            associationDescriptions.forEach((description: any, association: string) => {
                const color: Color = description.color;
                colorTable += `
                    <tr>
                        <td class="association-condition-col">${description.description}</td>
                        <td class="association-color-col" style="background-color:rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})"></td>
                    </tr>`;
            });
            colorTable += `</tbody></table>`;

            htmlContent += colorTable;
        } catch (ex) {
            console.error(ex);
        }

        this.view.webview.html = `${htmlHeader}${htmlContent}${htmlFooter}`;
    }
}