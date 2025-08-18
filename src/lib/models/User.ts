import mongoose, { Schema, Document } from "mongoose";
import { UserRole, UserStatus } from "../types/user";

// Re-export for backward compatibility
export { UserRole, UserStatus };

export interface IUser extends Document {
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

const UserSchema = new Schema<IUser>(
    {
        auth0Id: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        picture: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER,
        },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.ACTIVE,
        },
        lastLoginAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent re-compilation during development
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
