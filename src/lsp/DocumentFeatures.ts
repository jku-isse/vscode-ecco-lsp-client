import * as vscode from 'vscode';

export interface EccoDocumentFeaturesRequest {
    documentUri: string,
    requestedFeatures: string[] | null
}

export interface EccoDocumentFragmentFeatures {
    range: vscode.Range,
    features: string[]
}

export interface EccoDocumentFeaturesResponse {
    fragments: EccoDocumentFragmentFeatures[]
}
