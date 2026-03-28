import { Schema, model, models, Document } from "mongoose"

export interface IUser extends Document {
  name: string
  companyName: string
  slug: string
  slugLocked: boolean
  email: string
  passwordHash?: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    companyName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    slugLocked: { type: Boolean, default: false },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        const obj = ret as Record<string, unknown> & {
          _id?: unknown
          __v?: unknown
        }
        obj.id = obj._id
        delete obj._id
        delete obj.__v
      },
    },
    toObject: { virtuals: true },
  }
)

const User = models.User || model<IUser>("User", UserSchema)

export default User
