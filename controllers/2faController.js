import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import TwoFactorAuth from '../models/TwoFactorAuth.js';
import User from '../models/User.js';

// Генериране на QR и секрет
export const generate2FA = async (req, res) => {
  const userId = req.user._id;

  const secret = speakeasy.generateSecret({
    name: `SecureApp (${req.user.email})`,
  });

  try {
    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    // Запази или обнови в базата
    await TwoFactorAuth.findOneAndUpdate(
      { user: userId },
      { secret: secret.base32, enabled: false },
      { upsert: true }
    );

    res.json({ qrCode, secret: secret.base32 });
  } catch (err) {
    console.error('2FA QR генериране грешка:', err);
    res.status(500).json({ message: 'Възникна грешка при генериране на QR код.' });
  }
};

// Активиране на 2FA след проверка
export const verify2FA = async (req, res) => {
  const { token } = req.body;
  const userId = req.user._id;

  const record = await TwoFactorAuth.findOne({ user: userId });
  if (!record) return res.status(404).json({ message: 'Няма намерен 2FA запис.' });

  const isValid = speakeasy.totp.verify({
    secret: record.secret,
    encoding: 'base32',
    token,
  });

  if (!isValid) {
    return res.status(400).json({ message: 'Невалиден код.' });
  }

  record.enabled = true;
  await record.save();

  res.json({ message: '2FA успешно активирана.' });
};

// Деактивиране
export const disable2FA = async (req, res) => {
  const userId = req.user._id;

  await TwoFactorAuth.findOneAndDelete({ user: userId });

  res.json({ message: '2FA е деактивирана и изтрита.' });
};

// Проверка на токен при логин
export const validate2FAToken = async (userId, token) => {
  const record = await TwoFactorAuth.findOne({ user: userId });
  if (!record || !record.enabled) return false;

  return speakeasy.totp.verify({
    secret: record.secret,
    encoding: 'base32',
    token,
    window: 1,
  });
};