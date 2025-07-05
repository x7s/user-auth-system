import express from 'express';
import passport from 'passport';
import { loginUser, registerUser, verifyEmail } from '../controllers/authController.js';

const router = express.Router();

// 🔐 Login (GET)
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null });
});

// 🔐 Login (POST)
router.post('/login', loginUser);

// 👤 Register (GET)
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

// 👤 Register (POST)
router.post('/register', registerUser);

// 🔓 Logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/auth/login');
  });
});

// 🌐 Google OAuth — начална заявка
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 🌐 Google callback + пренасочване според роля
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/auth/login',
  session: true
}), (req, res) => {
  const user = req.user;

  // 📍 Пренасочване по роля
  if (user.role === 'admin') return res.redirect('/admin');
  if (user.role === 'moderator') return res.redirect('/moderator');
  return res.redirect('/dashboard');
});

// 📩 Email verification
router.get('/verify-email', verifyEmail);

export default router;