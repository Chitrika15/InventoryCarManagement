import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor?: Types.ObjectId | null;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
