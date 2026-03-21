import { Schema, model, models, Document } from "mongoose"

export interface IWorkInterval {
  startTime: string
  endTime: string
}

export interface IAvailability extends Document {
  userId: string
  slotDuration: number
  startTime: string
  endTime: string
  workDays: number[]
  reservedIntervals: IWorkInterval[]
}

const AvailabilitySchema = new Schema<IAvailability>(
  {
    userId: { type: String, ref: "User", required: true, unique: true },
    slotDuration: { type: Number, default: 30 },
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "18:00" },
    workDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    reservedIntervals: {
      type: [
        {
          startTime: { type: String, required: true },
          endTime: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: false,
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

const Availability =
  models.Availability ||
  model<IAvailability>("Availability", AvailabilitySchema)

export default Availability
