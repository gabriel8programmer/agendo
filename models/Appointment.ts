import { Schema, model, models, Document } from "mongoose"

export interface IAppointment extends Document {
  userId: string
  serviceId: string
  clientName: string
  clientWhatsapp?: string
  date: string
  time: string
  createdAt: Date
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    userId: { type: String, ref: "User", required: true },
    serviceId: { type: String, ref: "Service", required: true },
    clientName: { type: String, required: true },
    clientWhatsapp: { type: String },
    date: { type: String, required: true },
    time: { type: String, required: true },
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

const Appointment =
  models.Appointment || model<IAppointment>("Appointment", AppointmentSchema)

export default Appointment
