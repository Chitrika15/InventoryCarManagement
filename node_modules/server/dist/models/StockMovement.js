import mongoose, { Schema } from 'mongoose';
const stockMovementSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['IN', 'OUT', 'ADJUSTMENT'],
        required: true,
        index: true,
    },
    quantity: {
        type: Number,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer quantity',
        },
    },
    previousStock: {
        type: Number,
        required: true,
    },
    newStock: {
        type: Number,
        required: true,
        min: [0, 'New stock cannot be negative'],
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: false,
});
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ createdAt: -1 });
export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
