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

// 🔄 API: Връща данни за настройки (JSON)
router.get('/', isAuthenticated, logRouteAccess('API: Настройки на профила'), getAccountSettings);

// ✏️ Обновяване на име и имейл (основна форма)
router.post('/update', isAuthenticated, logRouteAccess('Обновяване на име/имейл'), updateAccountInfo);

// 🔒 Смяна на парола
router.post('/change-password', isAuthenticated, logRouteAccess('Смяна на парола'), changePassword);

// 👤 Пълно обновяване на профил – име, потребителско име, email
router.post('/update-profile', isAuthenticated, logRouteAccess('Пълно обновяване на профил'), updateProfile);

// 👁️ Визуален изглед на настройки (EJS)
router.get('/settings', isAuthenticated, logRouteAccess('Настройки на профила'), async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.render('account', {
    title: 'Настройки на профила',
    user
  });
});

// 📧 Смяна на имейл
router.post('/change-email', isAuthenticated, logRouteAccess('Смяна на имейл'), changeEmail);

// 📨 Изпращане на нов потвърдителен email
router.post('/send-verification', isAuthenticated, logRouteAccess('Изпратен потвърдителен имейл'), sendEmailVerification);

// ❌ Изтриване на акаунт
router.delete('/delete', isAuthenticated, logRouteAccess('Изтриване на акаунт'), deleteAccount);

export default router;