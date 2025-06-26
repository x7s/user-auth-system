// 🧩 Импорти на всички нужни модули
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import VerificationToken from '../models/VerificationToken.js';
import { sendVerificationEmail } from '../utils/sendVerificationEmail.js';
import { logProfileUpdate, logAccountDeletion } from '../utils/logger.js';
import sendNotification from '../utils/sendNotification.js';
import { createNotification } from '../utils/notifications.js';

// 👤 Преглед на текущия профил (GET /account/settings)
export const getAccountSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Грешка при зареждане на профил' });
  }
};

// ✏️ Обновяване на име и email (вътрешна логика, различна от updateProfile)
export const updateAccountInfo = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: 'Email вече се използва' });
      }
      user.email = email;
      user.emailVerified = false;
    }

    if (name) user.name = name;

    await user.save();
    res.json({ message: 'Информацията е актуализирана успешно' });
  } catch (error) {
    res.status(500).json({ error: 'Грешка при актуализацията' });
  }
};

// 🔒 Смяна на парола
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

    res.json({ message: 'Паролата е успешно променена' });
  } catch (error) {
    res.status(500).json({ error: 'Грешка при смяна на парола' });
  }
};

// 👤 Пълно обновяване на профил (име, потребителско име, email)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, username, email } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) return res.status(400).json({ error: 'Потребителското име е заето' });
      user.username = username;
    }

    let changes = '';
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

// 📧 Смяна на имейл
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

    res.json({ message: 'Имейлът е променен. Моля, потвърдете новия имейл.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при смяна на имейла' });
  }
};

// 📨 Изпращане на нов email за верификация
export const sendEmailVerification = async (req, res) => {
  try {
    const user = req.user;

    await sendVerificationEmail(user);

    res.json({ message: 'Имейлът за потвърждение беше изпратен успешно.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при изпращане на имейла.' });
  }
};

// ❌ Изтриване на акаунт
export const deleteAccount = async (req, res) => {
  try {
    const user = req.user;

    await User.findByIdAndDelete(user._id);
    await logAccountDeletion(user, req.ip);
    await sendNotification(user._id, 'Вашият акаунт беше изтрит.', 'danger');

    req.logout(() => {
      req.session.destroy();
      res.json({ message: 'Акаунтът е изтрит успешно.' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при изтриване на акаунта.' });
  }
};


/* * AccountController.js
 * оригинален код на контролера за управление на потребителски акаунт и настройки
  * 
  * 
  */
 /*
import User from '../models/User.js'
import bcrypt from 'bcryptjs'

// Преглед на текущ профил (вече имаме в userController, но може да дублираме или импортираме)
export const getAccountSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Грешка при зареждане на профил' })
  }
}

// Актуализиране на име и email
export const updateAccountInfo = async (req, res) => {
  try {
    const { name, email } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })

    // Проверка за промяна на email и дали не съществува вече
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) {
        return res.status(400).json({ error: 'Email вече се използва' })
      }
      user.email = email
    }
    if (name) user.name = name

    await user.save()
    res.json({ message: 'Информацията е актуализирана успешно' })
  } catch (error) {
    res.status(500).json({ error: 'Грешка при актуализацията' })
  }
}

// Смяна на парола
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Всички полета са задължителни' })
    }

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Текущата парола е грешна' })
    }

    // Хеширане на новата парола
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()

    res.json({ message: 'Паролата е успешно променена' })
  } catch (error) {
    res.status(500).json({ error: 'Грешка при смяна на парола' })
  }
}
*/