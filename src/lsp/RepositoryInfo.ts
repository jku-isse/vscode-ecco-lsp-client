export interface EccoCommitInfo {
    id: string;
    message: string;
    configuration: string;
    timestamp: number;
}

export interface EccoFeatureInfo {
    id: string;
    name: string;
    description: string;
    revisions: string[];
}

export interface EccoRepositoryInfoResponse {
    baseDir: string;
    configuration: string;
    commits: EccoCommitInfo[];
    features: EccoFeatureInfo[];
};
