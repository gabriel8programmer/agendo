import { Schema, model, models, Document } from "mongoose"

export interface IService extends Document {
  userId: string
  name: string
  duration: number
  price?: number
  createdAt: Date
}

const ServiceSchema = new Schema<IService>(
  {
    userId: { type: String, ref: "User", required: true },
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
      },
    },
    toObject: { virtuals: true },
  }
)

const Service = models.Service || model<IService>("Service", ServiceSchema)

export default Service
