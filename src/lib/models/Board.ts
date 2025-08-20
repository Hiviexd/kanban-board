import mongoose, { Schema, Document } from "mongoose";
import { BoardRole } from "../types/board";

export { BoardRole };

export interface IBoardMember {
    userId: mongoose.Types.ObjectId;
    role: BoardRole;
    joinedAt: Date;
}

export interface IBoard extends Document {
    title: string;
    description?: string;
    ownerId: mongoose.Types.ObjectId;
    members: IBoardMember[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BoardMemberSchema = new Schema<IBoardMember>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: Object.values(BoardRole),
        default: BoardRole.VIEWER,
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
});

const BoardSchema = new Schema<IBoard>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [BoardMemberSchema],
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Methods
BoardSchema.methods.getMemberRole = function (userId: string): BoardRole | null {
    const member = this.members.find((m: IBoardMember) => m.userId.toString() === userId.toString());
    return member ? member.role : null;
};

BoardSchema.methods.canUserEdit = function (userId: string): boolean {
    if (this.ownerId.toString() === userId.toString()) return true;
    const role = this.getMemberRole(userId);
    return role === BoardRole.EDITOR;
};

BoardSchema.methods.canUserView = function (userId: string): boolean {
    if (this.isPublic) return true;
    if (this.ownerId.toString() === userId.toString()) return true;
    return this.getMemberRole(userId) !== null;
};

const Board = mongoose.models.Board || mongoose.model<IBoard>("Board", BoardSchema);

export default Board;
