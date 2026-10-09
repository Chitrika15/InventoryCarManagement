import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProduct extends Document {
  _id: Types.ObjectId;
  sku: string;
  name: string;
  category: Types.ObjectId;
  brand: string;
  price: number; // Stored in paise (e.g. 50000 = ₹500.00)
  costPrice: number; // Stored in paise
  stock: number;
  reorderLevel: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for price (must be stored in paise)',
      },
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for costPrice (must be stored in paise)',
      },
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for stock',
      },
    },
    reorderLevel: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for reorderLevel',
      },
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ isActive: 1, stock: 1 });
productSchema.index({ brand: 1, isActive: 1 });

// Full text search index
productSchema.index(
  {
    name: 'text',
    sku: 'text',
    brand: 'text',
    description: 'text',
  },
  {
    weights: {
      sku: 10,
      name: 5,
      brand: 3,
      description: 1,
    },
    name: 'ProductTextSearchIndex',
  }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);
