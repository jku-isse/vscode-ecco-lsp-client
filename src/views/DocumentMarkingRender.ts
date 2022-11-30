import { Color, TextDocument, WebviewPanel } from 'vscode';
import logger from '../logger';
import { TextDocumentMarking, TextDocumentMarkingProcessor } from '../util/DocumentMarking';

interface ColoredLineFragment {
    content: string,
    color: Color | null
};

interface ColoredLine {
    fragments: ColoredLineFragment[]
}

interface ColoredDocument {
    lines: ColoredLine[]
}

export interface FragmentMarkingRendererData {
    color: Color,
    description: string
}

export async function renderDocumentMarkingsAsHtml<M> (document: TextDocument,
                                                       documentMarkings: TextDocumentMarking<M>,
                                                       rendererData: Map<M, FragmentMarkingRendererData>): Promise<string> {
    const documentNumOfLines = document.lineCount;
    const lineNumberWidth = Math.ceil(Math.log(documentNumOfLines) / Math.log(10));

    const htmlHeader = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    .document-contents {
                        display: flex,
                        flex-direction: column,
                        flex-wrap: nowrap;
                        font-family: var(--vscode-editor-font-family);
                    }

                    .document-line-number {
                        display: inline-block;
                        flex-grow: 0;
                        min-width: ${lineNumberWidth}ch;
                        width: ${lineNumberWidth}ch;
                        text-align: right;
                        font-weight: bold;
                        border-right-style: solid;
                        border-right-width: 1px;
                        padding-right: 5px;
                        margin-right: 3px;
                        user-select: none;
                    }

                    .document-line {
                        flex-grow: 1;
                        display: flex,
                        flex-direction: row,
                        flex-wrap: nowrap
                    }

                    .document-fragment {
                        white-space: pre;
                        display: inline-block;
                    }

                    .marking-table {
                        width: 95vw;
                        margin-top: 10px;
                    }

                    .marking-table th,
                    .marking-table td {
                        border: 1px solid;
                    }

                    .marking-description-col {
                        width: 80%
                    }

                    .marking-color-col {
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
        const markingProcessor = new TextDocumentMarkingProcessor<M>(document,
            {
                fragments: documentMarkings.fragments.map(fragment => ({
                    range: fragment.range,
                    marking: fragment.marking
                }))
            });
        
        const completeMarking = markingProcessor.complete();

        const aggregatedMarking = completeMarking.fragments.reduce((coloredDocument: ColoredDocument, fragment) => {
            if (fragment.range.start.line >= coloredDocument.lines.length) {
                coloredDocument.lines.push({
                    fragments: []
                });
            }

            const fragmentLine = document.lineAt(fragment.range.start.line);
            let fragmentColor = null;
            if (fragment.marking !== null && rendererData.has(fragment.marking)) {
                fragmentColor = rendererData.get(fragment.marking)?.color || fragmentColor;
            }

            coloredDocument.lines[coloredDocument.lines.length - 1].fragments.push({
                content: fragmentLine.text.substring(fragment.range.start.character, fragment.range.end.character),
                color: fragmentColor
            });

            return coloredDocument;
        }, {
            lines: []
        });

        htmlContent = `<div class="document-contents">` +
            aggregatedMarking.lines
                .map(line =>
                    line.fragments
                        .map(fragment => {
                            let cssProps = '';
                            const color = fragment.color;
                            if (color !== null) {
                                cssProps = `background-color: rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
                            }
                            return `<div class="document-fragment" style="${cssProps}">${fragment.content}</div>`;
                        })
                        .join(''))
                .map((line, lineNumber) => `
                    <div class="document-line">
                        <div class="document-line-number">${lineNumber + 1}</div>
                        ${line}
                    </div>`)
                .join('') +
                '</div>';
        
        let colorTable = `
            <table class="marking-table">
                <thead>
                    <th class="marking-description-col">Description</th>
                    <th class="marking-color-col">Color</th>
                </thead>
                <tbody>`;

        rendererData.forEach(({ description, color }) => {
            colorTable += `
                <tr>
                    <td class="marking-description-col">${description}</td>
                    <td class="marking-color-col" style="background-color:rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})"></td>
                </tr>`;
        });
        colorTable += `</tbody></table>`;

        htmlContent += colorTable;
    } catch (ex) {
        logger.error(ex);
    }

    return `${htmlHeader}${htmlContent}${htmlFooter}`;
}