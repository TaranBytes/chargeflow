import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const vehicleSchema = new mongoose.Schema(
  {
    make: String,
    model: String,
    batteryKWh: Number,
    connectorType: { type: String, enum: ['Type2', 'CCS', 'CHAdeMO', 'Tesla'] },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'operator', 'admin'], default: 'user' },
    phone: String,
    avatar: String,
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpiresAt: { type: Date, default: null, select: false },
    vehicles: [vehicleSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        delete ret.passwordHash
        return ret
      },
    },
  },
)

// ── instance helpers ────────────────────────────────────────────────────────
userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

// ── statics ─────────────────────────────────────────────────────────────────
userSchema.statics.hashPassword = async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

export const User = mongoose.model('User', userSchema)
