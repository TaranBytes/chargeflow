import mongoose from 'mongoose'

const meterReadingSchema = new mongoose.Schema(
  {
    ts: { type: Date, default: Date.now },
    energyWh: Number,
    powerW: Number,
    soc: Number, // 0..100
  },
  { _id: false },
)

const sessionSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    charger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Charger',
      required: true,
      index: true,
    },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    startTime: { type: Date, default: () => new Date() },
    endTime: Date,
    energyConsumed: { type: Number, default: 0 }, // kWh
    cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'INTERRUPTED', 'FAULTED'],
      default: 'ACTIVE',
      index: true,
    },
    meterReadings: { type: [meterReadingSchema], default: [] },
    stopReason: String,
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

sessionSchema.index({ user: 1, status: 1 })
sessionSchema.index({ charger: 1, startTime: -1 })

export const ChargingSession = mongoose.model('ChargingSession', sessionSchema)
