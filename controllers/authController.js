import passport from 'passport';
import crypto from 'crypto';
import User from '../models/User.js';
import VerificationToken from '../models/VerificationToken.js';
import TwoFactorAuth from '../models/TwoFactorAuth.js';
import { sendVerificationEmail } from '../utils/sendVerificationEmail.js';
import { createLog, logLogin, logLogout } from '../utils/logger.js';
import sendNotification from '../utils/sendNotification.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Имейлът вече се използва.' });

    const newUser = await User.create({ name, email, password });

    await createLog({
      user: newUser._id,
      action: 'register',
      details: `Потребител ${newUser.email} се регистрира.`,
      ip: req.ip,
    });

    await sendVerificationEmail(newUser);

    res.json({
      message: 'Регистрацията беше успешна. Моля, потвърдете имейла си.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при регистрация.' });
  }
};

export const loginUser = async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ message: info.message });

    const twoFA = await TwoFactorAuth.findOne({ user: user._id });

    req.login(user, async (err) => {
      if (err) return next(err);

      const twofaRequired = !!(twoFA && twoFA.enabled);
      req.session.twofaValidated = !twofaRequired;

      if (!twofaRequired) {
        await logLogin(user, req.ip);
        await createLog({
          user: user._id,
          action: 'login',
          details: `Потребител ${user.email} влезе.`,
          ip: req.ip,
        });
      }

      res.status(200).json({
        message: twofaRequired ? 'Изисква се 2FA.' : 'Успешен вход.',
        twofaRequired,
      });
    });
  })(req, res, next);
};

export const verifyEmail = async (req, res) => {
  const { token, id } = req.query;

  if (!token || !id) {
    return res.status(400).send('Невалиден линк за потвърждение');
  }

  try {
    const verificationToken = await VerificationToken.findOne({ userId: id, token });
    if (!verificationToken) {
      return res.status(400).send('Линкът е невалиден или е изтекъл');
    }

    const user = await User.findById(id);
    if (!user) return res.status(400).send('Потребителят не е намерен');

    user.emailVerified = true;
    await user.save();

    await VerificationToken.deleteOne({ _id: verificationToken._id });
    await sendNotification(user._id, 'Your email address has been verified.', 'success');

    res.send('Email адресът е успешно потвърден. Можете да влезете в системата.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Грешка при потвърждаване на email');
  }
};

export const logoutUser = async (req, res) => {
  await logLogout(req.user, req.ip);
  req.logout(() => {
    req.session.destroy();
    res.json({ message: 'Успешен изход.' });
  });
};
