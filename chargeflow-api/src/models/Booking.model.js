import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    charger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Charger',
      required: true,
      index: true,
    },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    estimatedKWh: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
      default: 'CONFIRMED',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID', 'REFUNDED'],
      default: 'UNPAID',
    },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ChargingSession', default: null },
    cancelReason: String,
  },
  {
    timestamps: true,
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

// Compound index helps the conflict-detection query stay snappy.
bookingSchema.index({ charger: 1, startTime: 1, endTime: 1 })
bookingSchema.index({ user: 1, createdAt: -1 })

// Validation: endTime must be after startTime.
bookingSchema.pre('validate', function (next) {
  if (this.endTime && this.startTime && this.endTime <= this.startTime) {
    return next(new Error('endTime must be after startTime'))
  }
  next()
})

export const Booking = mongoose.model('Booking', bookingSchema)
