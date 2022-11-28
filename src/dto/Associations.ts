import { Range } from "vscode"

export interface EccoDocumentAssociationsRequest {
    documentUri: string,
    documentText: string,
    collapse: boolean
}

export interface EccoFragmentAssociation {
    range: Range,
    association: string | null,
    associationCondition: string | null
}

export interface EccoDocumentAssociationsResponse {
    fragments: EccoFragmentAssociation[]
}
