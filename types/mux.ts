export interface MuxAsset {
    id: string;
    status: 'waiting' | 'preparing' | 'ready' | 'errored';
    duration?: number;
    max_stored_resolution?: string;
    max_stored_frame_rate?: number;
    aspect_ratio?: string;
    playback_ids?: Array<{
        id: string;
        policy: 'public' | 'signed' | 'drm';
    }>;
    tracks?: Array<{
        id: string;
        type: 'video' | 'audio' | 'text';
        duration?: number;
        max_width?: number;
        max_height?: number;
        max_frame_rate?: number;
    }>;
    created_at: string;
    updated_at?: string;
    errors?: {
        type?: string;
        messages?: string[];
    };
    meta?: {
        title?: string;
        creator_id?: string;
        external_id?: string;
    };
}

export interface MuxPlaybackId {
    id: string;
    policy: 'public' | 'signed' | 'drm';
}

export interface MuxStaticRendition {
    id: string;
    name: string;
    ext: 'mp4' | 'm4a';
    resolution: string;
    status: 'ready' | 'preparing' | 'skipped' | 'errored';
    filesize?: string;
    bitrate?: number;
    width?: number;
    height?: number;
}