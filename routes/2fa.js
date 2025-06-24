import express from 'express';
import {
  generate2FA,
  verify2FA,
  disable2FA,
  validate2FAToken,
} from '../controllers/2faController.js';
import { ensureAuth } from '../middlewares/auth.js';

const router = express.Router();

// Генериране на QR и секрет
router.get('/setup', ensureAuth, generate2FA);

// Потвърждаване на TOTP код
router.post('/verify', ensureAuth, verify2FA);

// Деактивиране
router.delete('/disable', ensureAuth, disable2FA);

// Потвърждение при логин (2-ра стъпка)
router.post('/validate-login', ensureAuth, async (req, res) => {
  const { token } = req.body;
  const isValid = await validate2FAToken(req.user._id, token);

  if (!isValid) {
    return res.status(400).json({ message: 'Невалиден код.' });
  }

  req.session.twofaValidated = true;
  res.json({ message: '2FA успешно премината. Добре дошъл!' });
});

export default router;