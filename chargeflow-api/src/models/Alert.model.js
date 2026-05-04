import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', default: null },
    chargerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Charger', default: null },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

alertSchema.index({ createdAt: -1 })
alertSchema.index({ severity: 1 })

export const Alert = mongoose.model('Alert', alertSchema)
