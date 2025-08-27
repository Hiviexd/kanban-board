import mongoose, { Schema, Document } from "mongoose";
import { BoardRole } from "../types/board";

export { BoardRole };

export interface IBoardLabel {
    id: string;
    name: string;
    color: string;
}

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
    labels: IBoardLabel[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BoardLabelSchema = new Schema<IBoardLabel>(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        color: {
            type: String,
            required: true,
            validate: {
                validator: function (color: string) {
                    // Validate hex color format
                    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
                },
                message: "Color must be a valid hex color (e.g., #FF0000 or #F00)",
            },
        },
    },
    { _id: false }
);

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
        labels: {
            type: [BoardLabelSchema],
            default: function () {
                // Default labels for new boards
                return [
                    { id: "label-1", name: "Priority", color: "#FF6B6B" },
                    { id: "label-2", name: "In Progress", color: "#4ECDC4" },
                    { id: "label-3", name: "Review", color: "#45B7D1" },
                    { id: "label-4", name: "Completed", color: "#96CEB4" },
                    { id: "label-5", name: "Bug", color: "#FECA57" },
                    { id: "label-6", name: "Feature", color: "#FF9FF3" },
                ];
            },
            validate: {
                validator: function (labels: IBoardLabel[]) {
                    // Ensure unique label IDs
                    const ids = labels.map((label) => label.id);
                    return ids.length === new Set(ids).size;
                },
                message: "Label IDs must be unique",
            },
        },
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

// Label management methods
BoardSchema.methods.getLabelById = function (labelId: string): IBoardLabel | null {
    return this.labels.find((label: IBoardLabel) => label.id === labelId) || null;
};

BoardSchema.methods.addLabel = function (label: IBoardLabel): void {
    // Check if label ID already exists
    if (this.getLabelById(label.id)) {
        throw new Error(`Label with ID ${label.id} already exists`);
    }
    this.labels.push(label);
};

BoardSchema.methods.updateLabel = function (labelId: string, updates: Partial<IBoardLabel>): boolean {
    const labelIndex = this.labels.findIndex((label: IBoardLabel) => label.id === labelId);
    if (labelIndex === -1) return false;

    // If updating ID, check for uniqueness
    if (updates.id && updates.id !== labelId && this.getLabelById(updates.id)) {
        throw new Error(`Label with ID ${updates.id} already exists`);
    }

    Object.assign(this.labels[labelIndex], updates);
    return true;
};

BoardSchema.methods.removeLabel = function (labelId: string): boolean {
    const labelIndex = this.labels.findIndex((label: IBoardLabel) => label.id === labelId);
    if (labelIndex === -1) return false;

    this.labels.splice(labelIndex, 1);
    return true;
};

const Board = mongoose.models.Board || mongoose.model<IBoard>("Board", BoardSchema);

export default Board;
