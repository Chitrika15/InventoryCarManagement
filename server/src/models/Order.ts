import mongoose, { Document, Schema, Types } from 'mongoose';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  sku: string;
  unitPrice: number; // Stored in paise
  quantity: number;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  at: Date;
  by?: Types.ObjectId | null;
  note?: string;
}

export interface IShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  customer: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number; // Stored in paise
  shippingAddress: IShippingAddress;
  status: OrderStatus;
  statusHistory: IOrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise price',
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer quantity',
      },
    },
  },
  { _id: false }
);

const statusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => Array.isArray(v) && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer amount in paise',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
