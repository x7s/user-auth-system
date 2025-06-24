import mongoose from 'mongoose';

const twoFactorAuthSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  secret: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TwoFactorAuth = mongoose.model('TwoFactorAuth', twoFactorAuthSchema);
export default TwoFactorAuth;