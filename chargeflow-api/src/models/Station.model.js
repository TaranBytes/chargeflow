import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  { _id: false },
)

const stationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    address: { type: addressSchema, default: () => ({}) },
    // GeoJSON Point — coordinates are [lng, lat]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true, validate: (v) => v.length === 2 },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    operatingHours: { type: String, default: '24/7' },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    averageChargeTimeMinutes: { type: Number, default: 45, min: 1 },
    totalChargers: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id
        // Convert GeoJSON to {lat, lng} so the frontend mock shape works as-is.
        if (ret.location?.coordinates?.length === 2) {
          ret.location = {
            lat: ret.location.coordinates[1],
            lng: ret.location.coordinates[0],
          }
        }
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

stationSchema.index({ location: '2dsphere' })
stationSchema.index({ name: 'text', 'address.city': 'text' })

export const Station = mongoose.model('Station', stationSchema)
