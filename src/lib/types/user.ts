export enum UserRole {
    ADMIN = "admin",
    USER = "user",
}

export enum UserStatus {
    ACTIVE = "active",
    BANNED = "banned",
}

export interface User {
    _id: string;
    auth0Id: string;
    email: string;
    name: string;
    picture?: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
