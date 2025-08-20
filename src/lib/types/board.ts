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
