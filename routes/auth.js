import express from 'express'
import passport from 'passport'
import bcrypt from 'bcrypt'
import User from '../models/User.js'
import { verifyEmail } from '../controllers/authController.js'
import { updateProfile, changeEmail, changePassword, sendEmailVerification, deleteAccount } from '../controllers/authController.js'
import { ensureAuthenticated } from '../middlewares/auth.js'
import { logRouteAccess } from '../middlewares/loggerMiddleware.js'

const router = express.Router()

// Рендиране на login форма (по-късно ще добавим EJS)
router.get('/login', (req, res) => {
  res.send('<h2>Login Page</h2><p>Ще добавим EJS по-късно.</p>')
})

// Рендиране на регистрационна форма
router.get('/register', (req, res) => {
  res.send('<h2>Register Page</h2><p>Ще добавим EJS по-късно.</p>')
})

// POST регистрация
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  try {
    let user = await User.findOne({ email })
    if (user) return res.status(400).send('Имейлът вече е зает.')

    const hashedPassword = await bcrypt.hash(password, 10)

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    })

    res.redirect('/auth/login')
  } catch (err) {
    console.error(err)
    res.status(500).send('Грешка при регистрация.')
  }
})

// POST вход с локален акаунт
router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
  })
)

// GET logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err)
    res.redirect('/auth/login')
  })
})

// GET Google вход
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

// Google callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/login',
    successRedirect: '/dashboard'
  })
)

router.get('/admin-panel', ensureAuthenticated, authorizeRoles('admin'), logRouteAccess('admin_panel_access'), (req, res) => {
  // ...
})

// Рут за потвърждение на email
router.get('/verify-email', verifyEmail)
router.delete('/account/delete', ensureAuthenticated, deleteAccount)
router.put('/account/profile', ensureAuthenticated, updateProfile)
router.put('/account/email', ensureAuthenticated, changeEmail)
router.put('/account/password', ensureAuthenticated, changePassword)
router.post('/send-verification-email', ensureAuthenticated, sendEmailVerification)

export default router