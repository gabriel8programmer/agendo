import { Document, Schema, model, models } from "mongoose"

export interface IPasswordResetRequest extends Document {
  userId?: string
  email: string
  requestId: string
  verifyTokenHash?: string
  expiresAt: Date
  verifiedAt?: Date
  usedAt?: Date
  createdAt: Date
}

const PasswordResetRequestSchema = new Schema<IPasswordResetRequest>(
  {
    userId: { type: String, required: false },
    email: { type: String, required: true, index: true },
    requestId: { type: String, required: true, unique: true, index: true },
    verifyTokenHash: { type: String, required: false, index: true },
    expiresAt: { type: Date, required: true, index: true },
    verifiedAt: { type: Date, required: false },
    usedAt: { type: Date, required: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

const PasswordResetRequest =
  models.PasswordResetRequest ||
  model<IPasswordResetRequest>("PasswordResetRequest", PasswordResetRequestSchema)

export default PasswordResetRequest

