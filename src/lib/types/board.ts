export enum BoardRole {
    OWNER = "owner",
    EDITOR = "editor",
    VIEWER = "viewer",
}

export interface BoardMember {
    userId: string;
    role: BoardRole;
    joinedAt: Date;
}

export interface Board {
    _id: string;
    title: string;
    description?: string;
    ownerId: string;
    members: BoardMember[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Temp interface for dummy data, switch to the one above when we have the real data
export interface BoardDisplay {
    _id: string;
    title: string;
    description: string;
    memberCount: number;
    lastActivity: string;
    isPublic: boolean;
}
