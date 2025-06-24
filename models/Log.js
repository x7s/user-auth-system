import mongoose from 'mongoose'

const logSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  action: { type: String, required: true },
  details: { type: String },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
})

const Log = mongoose.model('Log', logSchema)
export default Log