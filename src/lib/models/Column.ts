import mongoose, { Schema, Document } from "mongoose";

export interface IColumn extends Document {
    title: string;
    position: number;
    boardId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ColumnSchema = new Schema<IColumn>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        position: {
            type: Number,
            required: true,
            default: 0,
        },
        boardId: {
            type: Schema.Types.ObjectId,
            ref: "Board",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Static method to get next position for a board
ColumnSchema.statics.getNextPosition = async function (boardId: string): Promise<number> {
    const lastColumn = await this.findOne({ boardId }).sort({ position: -1 });
    return lastColumn ? lastColumn.position + 1 : 0;
};

// Static method to reorder columns after deletion or move
ColumnSchema.statics.reorderColumns = async function (
    boardId: string,
    startPosition: number,
    endPosition?: number
): Promise<void> {
    if (endPosition === undefined) {
        // Deletion case - shift all columns after startPosition down
        await this.updateMany({ boardId, position: { $gt: startPosition } }, { $inc: { position: -1 } });
    } else {
        // Move case - handle position updates between startPosition and endPosition
        if (startPosition < endPosition) {
            // Moving forward - shift intermediate columns back
            await this.updateMany(
                { boardId, position: { $gt: startPosition, $lte: endPosition } },
                { $inc: { position: -1 } }
            );
        } else {
            // Moving backward - shift intermediate columns forward
            await this.updateMany(
                { boardId, position: { $gte: endPosition, $lt: startPosition } },
                { $inc: { position: 1 } }
            );
        }
    }
};

const Column = mongoose.models.Column || mongoose.model<IColumn>("Column", ColumnSchema);

export default Column;
