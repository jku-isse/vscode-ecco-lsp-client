import * as vscode from 'vscode';

export interface TextDocumentFragmentMarking<M> {
    range: vscode.Range,
    marking: M | null
}

export interface TextDocumentMarking<M> {
    fragments: TextDocumentFragmentMarking<M>[]
}

function lastElement<T>(array: T[]): T | undefined {
    return array[array.length - 1];
}

export class TextDocumentMarkingProcessor<M> {
    private textDocument: vscode.TextDocument;
    private marking: TextDocumentMarking<M>;

    constructor (textDocument: vscode.TextDocument, initialMarking: TextDocumentMarking<M>) {
        this.textDocument = textDocument;
        this.marking = initialMarking;
    }

    public complete(): TextDocumentMarking<M> {
        const completeMarking = this.marking.fragments.map((fragment: TextDocumentFragmentMarking<M>): TextDocumentFragmentMarking<M> => {
            if (fragment.range.start.line !== fragment.range.end.line) {
                throw new Error('Expected every fragment returned by ECCO LSP document association service to cover only a single line');
            }

            const textLine = this.textDocument.lineAt(fragment.range.start.line);
            const range = new vscode.Range(
                new vscode.Position(fragment.range.start.line, Math.min(fragment.range.start.character, textLine.range.end.character)),
                new vscode.Position(fragment.range.end.line, Math.min(fragment.range.end.character, textLine.range.end.character))
            );
            return Object.assign({}, fragment, {
                range
            });
        }).reduce((completeMarking: TextDocumentMarking<M>, fragment: TextDocumentFragmentMarking<M>): TextDocumentMarking<M> => {
            // Fill in skipped fragments
            this.runCompletion(completeMarking, fragment.range.start);
            completeMarking.fragments.push(fragment);
            return completeMarking;
        }, { fragments: [] });

        // Fill in last lines
        const lastLineNumber = this.textDocument.lineCount - 1;
        const lastLine = this.textDocument.lineAt(lastLineNumber);
        this.runCompletion(completeMarking, lastLine.range.end);

        return completeMarking;
    }

    private runCompletion(completeMarking: TextDocumentMarking<M>, pos: vscode.Position) {
        if (completeMarking.fragments.length === 0) {
            // Fill in empty fragment list
            for (let lineNumber = 0; lineNumber < pos.line; lineNumber++) {
                const line = this.textDocument.lineAt(lineNumber);

                completeMarking.fragments.push({
                    marking: null,
                    range: line.range
                });
            }

            if (pos.character > 0) {
                completeMarking.fragments.push({
                    marking: null,
                    range: new vscode.Range(
                        new vscode.Position(pos.line, 0),
                        pos
                    )
                });
            }
        }

        for (let lastFragment = lastElement(completeMarking.fragments);
            lastFragment && 
            (lastFragment.range.start.line < pos.line ||
            (lastFragment.range.start.line === pos.line && lastFragment.range.start.character < pos.character));
            lastFragment = lastElement(completeMarking.fragments)) {
            
            const lastLineNumber = lastFragment.range.start.line;
            const lastLine = this.textDocument.lineAt(lastLineNumber);

            if (lastFragment.range.start.line < pos.line &&
                lastFragment.range.end.character < lastLine.range.end.character) {
                // Add empty fragment to fill in the line until the end
                completeMarking.fragments.push({
                    marking: null,
                    range: new vscode.Range(
                        lastFragment.range.end,
                        lastLine.range.end
                    )
                });
            } else if (lastFragment.range.start.line + 1 < pos.line) {
                // Add empty fragment to fill in the next line until the end
                const nextLineNumber = lastLineNumber + 1;
                const nextLine = this.textDocument.lineAt(nextLineNumber);

                completeMarking.fragments.push({
                    marking: null,
                    range: nextLine.range
                });
            } else {
                const nextLineNumber = lastLineNumber + 1;
                const nextLine = this.textDocument.lineAt(nextLineNumber);

                if (nextLine.range.start.isBefore(pos)) {
                    completeMarking.fragments.push({
                        marking: null,
                        range: new vscode.Range(
                            nextLine.range.start,
                            pos
                        )
                    });
                } else {
                    break;
                }
            }
        }
    }
}