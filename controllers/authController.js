import passport from 'passport';
import crypto from 'crypto';
import User from '../models/User.js';
import VerificationToken from '../models/VerificationToken.js';
import TwoFactorAuth from '../models/TwoFactorAuth.js';
import { sendVerificationEmail } from '../utils/sendVerificationEmail.js';
import { createLog, logLogin, logLogout } from '../utils/logger.js';
import sendNotification from '../utils/sendNotification.js';

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await createLog({
        action: 'register_attempt_failed',
        ip: req.ip,
        details: `Опит за регистрация с вече съществуващ имейл: ${email}`,
      });

      return res.render('register', {
        title: 'Register',
        error: 'Този имейл вече съществува.',
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      name,
      email,
      password,
      role: 'user',
      isVerified: false,
      verificationToken,
    });

    await newUser.save();
    await sendVerificationEmail(email, verificationToken);

    await createLog({
      user: newUser._id,
      action: 'register',
      ip: req.ip,
      details: `Потребител ${newUser.email} се регистрира.`,
    });

    res.render('login', {
      title: 'Login',
      success: 'Провери имейла си за потвърждение преди вход.',
    });
  } catch (err) {
    console.error(err);

    await createLog({
      action: 'register_error',
      ip: req.ip,
      details: `Грешка при регистрация: ${err.message}`,
    });

    res.render('register', {
      title: 'Register',
      error: 'Възникна грешка при регистрацията.',
    });
  }
};

export const loginUser = async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      await createLog({
        action: 'login_failed',
        ip: req.ip,
        details: `Неуспешен вход за ${req.body?.email}`,
      });
      return res.status(400).json({ message: info.message });
    }

    const twoFA = await TwoFactorAuth.findOne({ user: user._id });

    req.login(user, async (err) => {
      if (err) return next(err);

      const twofaRequired = !!(twoFA && twoFA.enabled);
      req.session.twofaValidated = !twofaRequired;

      if (twofaRequired) {
        return res.status(200).json({
          message: 'Изисква се 2FA.',
          twofaRequired: true,
        });
      }

      await logLogin(user, req.ip);
      await createLog({
        user: user._id,
        action: 'login',
        details: `Потребител ${user.email} влезе.`,
        ip: req.ip,
      });

      const role = user.role;
      if (role === 'admin') return res.redirect('/admin');
      if (role === 'moderator') return res.redirect('/moderator');
      return res.redirect('/dashboard');
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

    await sendNotification(user._id, 'Вашият имейл беше потвърден.', 'success');
    await createLog({
      user: user._id,
      action: 'email_verified',
      ip: req.ip,
      details: `Потребителят потвърди имейл адреса.`,
    });

    res.send('Email адресът е успешно потвърден. Можете да влезете в системата.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Грешка при потвърждаване на email');
  }
};

export const logoutUser = async (req, res) => {
  await logLogout(req.user, req.ip);
  await createLog({
    user: req.user._id,
    action: 'logout',
    ip: req.ip,
    details: `Потребител ${req.user.email} излезе от системата.`,
  });

  req.logout(() => {
    req.session.destroy();
    res.json({ message: 'Успешен изход.' });
  });
};