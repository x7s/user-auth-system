import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import { logRouteAccess } from '../middlewares/loggerMiddleware.js';
import {
  getAccountSettings,
  updateAccountInfo,
  changePassword,
  updateProfile,
  changeEmail,
  sendEmailVerification,
  deleteAccount,
} from '../controllers/accountController.js';
import User from '../models/User.js';

const router = express.Router();

// 🧾 Взимане на текущите настройки на акаунта
router.get('/', isAuthenticated, getAccountSettings);

// ✏️ Обновяване на име и имейл (основна форма)
router.post('/update', isAuthenticated, updateAccountInfo);

// 🔒 Смяна на парола
router.post('/change-password', isAuthenticated, changePassword);

// 👤 Пълно обновяване на профил – име, потребителско име, email
router.post('/update-profile', isAuthenticated, updateProfile);
router.get('/settings', isAuthenticated, logRouteAccess('Настройки на профила'), async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.render('account', {
    title: 'Настройки на профила',
    user
  });
});

// 📧 Смяна на имейл
router.post('/change-email', isAuthenticated, changeEmail);

// 📨 Изпращане на нов потвърдителен email
router.post('/send-verification', isAuthenticated, sendEmailVerification);

// ❌ Изтриване на акаунт
router.delete('/delete', isAuthenticated, deleteAccount);

export default router;
/* * account.js
 * оригинален код на Рутера за управление на акаунт настройки и действия
 */
/*
import express from 'express'
import { isAuthenticated } from '../middlewares/auth.js'
import {
  getAccountSettings,
  updateAccountInfo,
  changePassword,
} from '../controllers/accountController.js'

const router = express.Router()

// Получаване на акаунт настройки (данни)
router.get('/', isAuthenticated, getAccountSettings)

// Актуализация на име и email
router.post('/update', isAuthenticated, updateAccountInfo)

// Смяна на парола
router.post('/change-password', isAuthenticated, changePassword)

export default router
*/