import { Schema, model, models, Document } from "mongoose"

interface IWorkInterval {
  startTime: string
  endTime: string
}

interface IProfessionalAvailability {
  slotDuration: number
  startTime: string
  endTime: string
  workDays: number[]
  reservedIntervals: IWorkInterval[]
}

export interface IProfessional extends Document {
  userId: string
  name: string
  whatsapp?: string
  isActive: boolean
  serviceIds: string[]
  availability: IProfessionalAvailability
  photoUrl?: string
  createdAt: Date
}

const WorkIntervalSchema = new Schema<IWorkInterval>(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
)

const ProfessionalSchema = new Schema<IProfessional>(
  {
    userId: { type: String, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    serviceIds: { type: [String], default: [] },
    availability: {
      slotDuration: { type: Number, default: 30 },
      startTime: { type: String, default: "09:00" },
      endTime: { type: String, default: "18:00" },
      workDays: { type: [Number], default: [1, 2, 3, 4, 5] },
      reservedIntervals: { type: [WorkIntervalSchema], default: [] },
    },
    photoUrl: { type: String, trim: true },
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

ProfessionalSchema.index({ userId: 1, isActive: 1, createdAt: -1 })

const Professional =
  models.Professional || model<IProfessional>("Professional", ProfessionalSchema)

export default Professional
