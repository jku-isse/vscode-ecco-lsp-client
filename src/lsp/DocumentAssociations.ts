import * as vscode from 'vscode';

export interface EccoDocumentAssociationsRequest {
    documentUri: string
}

export interface EccoAssociationInfo {
    id: string,
    condition: string
}

export interface EccoDocumentFragmentAssociation {
    range: vscode.Range,
    association: EccoAssociationInfo
}

export interface EccoDocumentAssociationsResponse {
    fragments: EccoDocumentFragmentAssociation[]
}
