import mongoose, { Schema } from 'mongoose';
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer',
        index: true,
    },
    refreshTokenHash: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            delete ret.passwordHash;
            delete ret.refreshTokenHash;
            return ret;
        },
    },
});
export const User = mongoose.model('User', userSchema);
