import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Charger } from '../models/Charger.model.js'

export const getCharger = asyncHandler(async (req, res) => {
  const charger = await Charger.findById(req.params.id).populate('station', 'name address location')
  if (!charger) throw ApiError.notFound('Charger not found')
  res.json({ success: true, data: charger.toJSON() })
})
