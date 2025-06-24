import { validate2FAToken } from '../controllers/2faController.js';
import TwoFactorAuth from '../models/TwoFactorAuth.js';

export const require2FA = async (req, res, next) => {
  const user = req.user;

  const twoFA = await TwoFactorAuth.findOne({ user: user._id });
  if (!twoFA || !twoFA.enabled) {
    return next(); // няма активирана 2FA – продължаваме
  }

  // Проверяваме дали 2FA е премината в сесията
  if (req.session.twofaValidated) {
    return next(); // вече преминал 2FA
  }

  // Ако не е премината, спираме тук
  return res.status(401).json({ message: 'Изисква се 2FA код.', twofaRequired: true });
};