export enum BoardRole {
    OWNER = "owner",
    EDITOR = "editor",
    VIEWER = "viewer",
}

export interface BoardLabel {
    id: string;
    name: string;
    color: string;
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
    labels: BoardLabel[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Extended board interface with computed properties for display
export interface BoardWithMetadata extends Board {
    memberCount: number;
    lastActivity?: string | Date;
    userRole?: BoardRole;
    canEdit: boolean;
    canView: boolean;
}

// Request/Response types for API
export interface CreateBoardRequest {
    title: string;
    description?: string;
    isPublic?: boolean;
    labels?: BoardLabel[];
}

export interface UpdateBoardRequest {
    title?: string;
    description?: string;
    isPublic?: boolean;
    labels?: BoardLabel[];
}

export interface AddBoardMemberRequest {
    userId: string;
    role: BoardRole;
}

export interface UpdateBoardMemberRequest {
    role: BoardRole;
}
