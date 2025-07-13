import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import VerificationToken from '../models/VerificationToken.js';
import { sendVerificationEmail } from '../utils/sendVerificationEmail.js';
import {
  logProfileUpdate,
  logAccountDeletion,
  createLog
} from '../utils/logger.js';
import sendNotification from '../utils/sendNotification.js';
import { createNotification } from '../utils/notifications.js';

export const getAccountSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });

    await createLog({
      user: req.user._id,
      action: 'view_account_settings',
      ip: req.ip,
      details: `Достъп до настройките на профила.`,
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Грешка при зареждане на профил' });
  }
};

export const updateAccountInfo = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        req.flash('error', 'Този Email вече се използва.');
        return res.redirect('/account/settings');
      }
      user.email = email;
      user.emailVerified = false;
    }

    if (name) user.name = name;

    await user.save();

    await createLog({
      user: user._id,
      action: 'account_update',
      ip: req.ip,
      details: `${req.username} Актуализира ${email ? 'email,' : ''} ${name ? 'name' : ''} в профила си.`,
    });

    req.flash('success', 'Информацията е актуализирана успешно.');
    res.redirect('/account/settings');
  } catch (error) {
    res.status(500).json({ error: 'Грешка при актуализацията' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Всички полета са задължителни' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Текущата парола е грешна' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await sendNotification(user._id, 'Паролата ви беше променена.', 'success');
    await createNotification(user._id, 'Паролата беше успешно променена.');
    await createLog({
      user: user._id,
      action: 'password_changed',
      ip: req.ip,
      details: `Потребителят смени паролата си.`,
    });

    res.json({ message: 'Паролата е успешно променена' });
  } catch (error) {
    res.status(500).json({ error: 'Грешка при смяна на парола' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, username, email } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });

    let changes = '';

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) return res.status(400).json({ error: 'Потребителското име е заето' });
      changes += `Username: ${user.username} → ${username}; `;
      user.username = username;
    }

    if (name && name !== user.name) {
      changes += `Име: ${user.name} → ${name}; `;
      user.name = name;
    }

    if (email && email !== user.email) {
      changes += `Имейл: ${user.email} → ${email}; `;
      user.email = email;
      user.emailVerified = false;
    }

    await user.save();
    await logProfileUpdate(user, changes, req.ip);
    await sendNotification(user._id, 'Профилът беше обновен успешно.', 'info');

    res.json({ message: 'Профилът е обновен успешно' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при обновяване на профила' });
  }
};

export const changeEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { newEmail } = req.body;

    const existingUser = await User.findOne({ email: newEmail, _id: { $ne: userId } });
    if (existingUser) return res.status(400).json({ error: 'Имейлът вече е зает' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });

    user.email = newEmail;
    user.emailVerified = false;
    await user.save();

    await sendVerificationEmail(user);
    await createLog({
      user: user._id,
      action: 'email_changed',
      ip: req.ip,
      details: `Промяна на имейл на: ${newEmail}`,
    });

    res.json({ message: 'Имейлът е променен. Моля, потвърдете новия имейл.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при смяна на имейла' });
  }
};

export const sendEmailVerification = async (req, res) => {
  try {
    const user = req.user;
    await sendVerificationEmail(user);

    await createLog({
      user: user._id,
      action: 'verification_email_sent',
      ip: req.ip,
      details: `Изпратен е нов верификационен имейл.`,
    });

    res.json({ message: 'Имейлът за потвърждение беше изпратен успешно.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при изпращане на имейла.' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const user = req.user;

    await User.findByIdAndDelete(user._id);
    await logAccountDeletion(user, req.ip);
    await sendNotification(user._id, 'Вашият акаунт беше изтрит.', 'danger');

    await createLog({
      user: user._id,
      action: 'account_deleted',
      ip: req.ip,
      details: `Акаунтът беше изтрит от потребителя.`,
    });

    req.logout(() => {
      req.session.destroy();
      res.json({ message: 'Акаунтът е изтрит успешно.' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при изтриване на акаунта.' });
  }
};