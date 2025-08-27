import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
    title: string;
    description?: string;
    assigneeId?: mongoose.Types.ObjectId;
    startDate?: Date;
    dueDate?: Date;
    labels: string[]; // Array of label IDs from the board's label set
    isComplete: boolean;
    columnId: mongoose.Types.ObjectId;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        assigneeId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        startDate: {
            type: Date,
            default: null,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        labels: {
            type: [String],
            default: [],
            validate: {
                validator: function (labels: string[]) {
                    // Ensure no duplicate labels
                    return labels.length === new Set(labels).size;
                },
                message: "Duplicate labels are not allowed",
            },
        },
        isComplete: {
            type: Boolean,
            default: false,
        },
        columnId: {
            type: Schema.Types.ObjectId,
            ref: "Column",
            required: true,
        },
        position: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Validation: startDate should be before dueDate
TaskSchema.pre("save", function (next) {
    if (this.startDate && this.dueDate && this.startDate > this.dueDate) {
        next(new Error("Start date cannot be after due date"));
    } else {
        next();
    }
});

// Static method to get next position for a column
TaskSchema.statics.getNextPosition = async function (columnId: string): Promise<number> {
    const lastTask = await this.findOne({ columnId }).sort({ position: -1 });
    return lastTask ? lastTask.position + 1 : 0;
};

// Static method to reorder tasks after deletion or move
TaskSchema.statics.reorderTasks = async function (
    columnId: string,
    startPosition: number,
    endPosition?: number
): Promise<void> {
    if (endPosition === undefined) {
        // Deletion case - shift all tasks after startPosition down
        await this.updateMany({ columnId, position: { $gt: startPosition } }, { $inc: { position: -1 } });
    } else {
        // Move case - handle position updates between startPosition and endPosition
        if (startPosition < endPosition) {
            // Moving forward - shift intermediate tasks back
            await this.updateMany(
                { columnId, position: { $gt: startPosition, $lte: endPosition } },
                { $inc: { position: -1 } }
            );
        } else {
            // Moving backward - shift intermediate tasks forward
            await this.updateMany(
                { columnId, position: { $gte: endPosition, $lt: startPosition } },
                { $inc: { position: 1 } }
            );
        }
    }
};

// Static method to move task between columns
TaskSchema.statics.moveTaskBetweenColumns = async function (
    taskId: string,
    sourceColumnId: string,
    targetColumnId: string,
    sourcePosition: number,
    targetPosition: number
): Promise<void> {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            // Remove task from source column (shift remaining tasks)
            await this.updateMany(
                { columnId: sourceColumnId, position: { $gt: sourcePosition } },
                { $inc: { position: -1 } },
                { session }
            );

            // Make space in target column
            await this.updateMany(
                { columnId: targetColumnId, position: { $gte: targetPosition } },
                { $inc: { position: 1 } },
                { session }
            );

            // Update the task itself
            await this.updateOne({ _id: taskId }, { columnId: targetColumnId, position: targetPosition }, { session });
        });
    } finally {
        await session.endSession();
    }
};

// Method to check if task is overdue
TaskSchema.methods.isOverdue = function (): boolean {
    return this.dueDate && !this.isComplete && new Date() > this.dueDate;
};

// Method to get task priority based on due date
TaskSchema.methods.getPriority = function (): "high" | "medium" | "low" | "none" {
    if (!this.dueDate) return "none";

    const now = new Date();
    const dueDate = new Date(this.dueDate);
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "high"; // Overdue
    if (diffDays <= 3) return "high"; // Due within 3 days
    if (diffDays <= 7) return "medium"; // Due within a week
    return "low"; // Due later
};

const Task = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
