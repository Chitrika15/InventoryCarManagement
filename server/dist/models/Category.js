import mongoose, { Schema } from 'mongoose';
const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
}, {
    timestamps: true,
});
export const Category = mongoose.model('Category', categorySchema);
