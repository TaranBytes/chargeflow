import mongoose from 'mongoose'

const chargerSchema = new mongoose.Schema(
  {
    // Public/operator-facing identifier (matches "chargerId" in spec, "ocppId" in arch doc).
    ocppId: { type: String, required: true, unique: true, trim: true, index: true },
    station: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
      index: true,
    },
    type: { type: String, enum: ['AC', 'DC'], required: true },
    connectorType: {
      type: String,
      enum: ['Type2', 'CCS', 'CHAdeMO', 'Tesla'],
      required: true,
    },
    powerKW: { type: Number, required: true, min: 1 },
    pricePerKWh: { type: Number, required: true, min: 0, default: 12 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'OFFLINE', 'FAULTED'],
      default: 'AVAILABLE',
      index: true,
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingSession',
      default: null,
    },
    lastHeartbeat: Date,
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

export const Charger = mongoose.model('Charger', chargerSchema)
