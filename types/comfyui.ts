export interface ComfyUIWorkflow {
    nodes: ComfyUINode[];
    metadata?: {
        title?: string;
        description?: string;
        version?: string;
    };
}

export interface ComfyUINode {
    id: number;
    type: string;
    inputs: Record<string, any>;
    outputs?: Record<string, any>;
    properties?: Record<string, any>;
}

export interface ComfyUIResponse {
    prompt_id: string;
    number: number;
    node_errors: Record<string, string>;
}

export interface ComfyUIImage {
    filename: string;
    subfolder: string;
    type: string;
}

export interface ComfyUIHistory {
    prompt: ComfyUIWorkflow;
    outputs: Record<string, ComfyUIImage[]>;
    status: {
        status_str: string;
        completed: boolean;
        messages: string[];
    };
}

export interface ThumbnailGenerationResult {
    thumbnailUrl: string;
    generationTime: number;
    workflowId: string;
    metadata?: {
        style: string;
        resolution: string;
        format: string;
    };
}

export interface VideoEnhancementResult {
    enhancedAssetId: string;
    processingStatus: 'queued' | 'processing' | 'completed' | 'failed';
    estimatedTime: number;
    enhancementDetails: {
        originalResolution: string;
        targetResolution: string;
        enhancementType: string;
        aiModel: string;
    };
}