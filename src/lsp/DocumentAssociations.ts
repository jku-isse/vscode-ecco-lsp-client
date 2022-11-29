import * as vscode from 'vscode';

export interface EccoDocumentAssociationsRequest {
    documentUri: string,
    documentText: string,
    collapse: boolean
}

export interface EccoDocumentFragmentAssociation {
    range: vscode.Range,
    association: string | null,
    associationCondition: string | null
}

export interface EccoDocumentAssociationsResponse {
    fragments: EccoDocumentFragmentAssociation[]
}
