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
/*
 * AuthController.js
 * оригинален сорс код на контролера за управление на автентикация и потребителски действия
 */
/*
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import VerificationToken from '../models/VerificationToken.js'
import User from '../models/User.js'
import TwoFactorAuth from '../models/TwoFactorAuth.js';
import Log from '../models/Log.js';
import transporter from '../config/nodemailer.js'
import { sendVerificationEmail } from '../utils/sendVerificationEmail.js'
import { createLog, logLogin, logLogout, logProfileUpdate, logAccountDeletion } from '../utils/logger.js'
import sendNotification from '../utils/sendNotification.js';
import { createNotification } from '../utils/notifications.js';
import passport from 'passport';

export const registerUser = async (req, res) => {
  try {
    const newUser = await User.create({  })

    await createLog({
      user: newUser._id,
      action: 'register',
      details: `Потребител ${newUser.email} се регистрира.`,
      ip: req.ip,
    })

    res.json({ message: 'Регистрация успешна.' })
  } catch (error) {
    res.status(500).json({ error: 'Грешка при регистрация.' })
  }
}

// Пример: логване при успешен вход
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

// Актуализиране на потребителски профил
export const updateProfile = async (req, res) => {
    const user = req.user
    const { name, email } = req.body
  try {
    const userId = req.user._id
    const { name, username } = req.body

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })

    if (name) user.name = name
    if (username) {
      // Проверка за уникалност на username
      const existingUser = await User.findOne({ username, _id: { $ne: userId } })
      if (existingUser) return res.status(400).json({ error: 'Потребителското име е заето' })

      user.username = username
    }
    // Определяне на промените за лога
    let changes = ''
    if (name && name !== user.name) changes += `name: ${user.name} -> ${name}; `
    if (email && email !== user.email) changes += `email: ${user.email} -> ${email}; `
    // Актуализиране
    user.name = name || user.name
    user.email = email || user.email
    await user.save()
    
    await logProfileUpdate(user, changes, req.ip)
    res.json({ message: 'Профилът беше обновен успешно.' })

    await user.save()
    await sendNotification(req.user._id, 'Your profile information was updated.', 'info');
    res.json({ message: 'Профилът е обновен успешно' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Грешка при обновяване на профила' })
  }
}

export const changeEmail = async (req, res) => {
  try {
    const userId = req.user._id
    const { newEmail } = req.body

    // Проверка дали email е зает
    const existingUser = await User.findOne({ email: newEmail, _id: { $ne: userId } })
    if (existingUser) return res.status(400).json({ error: 'Имейлът вече е зает' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })

    user.email = newEmail
    user.emailVerified = false // трябват ново потвърждение
    await user.save()

    // Изпращаме нов email за потвърждение (ползвай sendVerificationEmail, но трябва да преработим малко)
    await sendVerificationEmail(user, req, res)

    res.json({ message: 'Имейлът е променен. Моля, потвърдете новия имейл.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Грешка при смяна на имейла' })
  }
}

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })

    // Проверка на старата парола
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(400).json({ error: 'Текущата парола е грешна' })

    // Хешираме новата парола
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()
    // Пример за успешна смяна на парола:
    await sendNotification(req.user._id, 'Your password was successfully changed.', 'success');
    await createNotification(req.user._id, 'Вашата парола беше успешно променена.');
    res.json({ message: 'Паролата е променена успешно' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Грешка при смяна на паролата' })
  }
}

export const deleteAccount = async (req, res) => {
    const user = req.user
  try {
    const userId = req.user._id

    // Изтриваме потребителя
    await User.findByIdAndDelete(userId)

    // Тук можем да добавим и изтриване на свързани данни, ако има такива (например проекти, публикации и т.н.)

    // След изтриването, изчистваме сесията / токена
    req.logout() // ако използваш Passport локален
    req.session.destroy()

    res.json({ message: 'Акаунтът е изтрит успешно.' })
    await logAccountDeletion(user, req.ip)
    await User.findByIdAndDelete(user._id)
    await sendNotification(req.user._id, 'Your account has been deleted.', 'danger');
    req.logout()
    req.session.destroy()
    res.json({ message: 'Акаунтът е изтрит успешно.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Грешка при изтриване на акаунта.' })
  }
}

// След успешна регистрация, изпращаме email за потвърждение
export const sendVerificationEmail = async (user, req, res) => {
  try {
    // Генерираме токен
    const token = crypto.randomBytes(32).toString('hex')

    // Записваме токена в базата
    const verificationToken = new VerificationToken({
      userId: user._id,
      token,
    })
    await verificationToken.save()

    // Създаваме линк за потвърждение
    const verificationUrl = `${req.protocol}://${req.get('host')}/auth/verify-email?token=${token}&id=${user._id}`

    // Писмо
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: user.email,
      subject: 'Потвърди своя email адрес',
      html: `<p>Здравейте ${user.name || user.username},</p>
        <p>Моля, потвърдете своя email, като кликнете на линка по-долу:</p>
        <a href="${verificationUrl}">Потвърди email</a>
        <p>Ако не сте правили регистрация, игнорирайте това съобщение.</p>
      `,
    }

    await transporter.sendMail(mailOptions)

    res.json({ message: 'Пратен е email за потвърждение. Моля, проверете пощата си.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Грешка при изпращане на потвърдителния имейл' })
  }
}

export const sendEmailVerification = async (req, res) => {
  try {
    const user = req.user

    // Генерираме уникален токен за верификация
    const verificationToken = crypto.randomBytes(32).toString('hex')

    user.emailVerificationToken = verificationToken
    user.emailVerified = false
    await user.save()

    await sendVerificationEmail(user, verificationToken)

    res.json({ message: 'Имейлът за потвърждение беше изпратен успешно.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Грешка при изпращане на имейла.' })
  }
}

// Рут за верификация на email
export const verifyEmail = async (req, res) => {
  const { token, id } = req.query

  if (!token || !id) {
    return res.status(400).send('Невалиден линк за потвърждение')
  }

  try {
    const verificationToken = await VerificationToken.findOne({ userId: id, token })
    if (!verificationToken) {
      return res.status(400).send('Линкът е невалиден или е изтекъл')
    }

    // Обновяваме user-a
    const user = await User.findById(id)
    if (!user) return res.status(400).send('Потребителят не е намерен')

    user.emailVerified = true
    await user.save()

    // Изтриваме използвания токен
    await VerificationToken.deleteOne({ _id: verificationToken._id })
    await sendNotification(req.user._id, 'Your email address has been verified.', 'success');

    res.send('Email адресът е успешно потвърден. Можете да влезете в системата.')
  } catch (error) {
    console.error(error)
    res.status(500).send('Грешка при потвърждаване на email')
  }
}

export const logoutUser = async (req, res) => {
  await logLogout(req.user, req.ip)
  req.logout()
  req.session.destroy()
  res.json({ message: 'Успешен изход.' })
}

router.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), logLogin, (req, res) => {
  res.redirect('/dashboard');
});

router.get('/logout', logLogout, (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});
*/