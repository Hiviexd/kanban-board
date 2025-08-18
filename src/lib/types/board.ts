// Client-safe board types and enums
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

// Client-safe board interface (without Mongoose Document)
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
