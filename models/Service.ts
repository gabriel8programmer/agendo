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

const Service = models.Service || model<IService>("Service", ServiceSchema)

export default Service
