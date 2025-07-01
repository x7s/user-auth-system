import express from 'express'
import { isAuthenticated, ensureRole, ensureRoles } from '../middlewares/auth.js'

const router = express.Router()

// Общ потребителски dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.send(`<h1>Потребителски Dashboard</h1><p>Здравей, ${req.user.name}!</p><p>Роля: ${req.user.role}</p>`);
});

// Модераторски панел
router.get('/moderator', ensureRoles(['admin', 'moderator']), (req, res) => {
  res.send(`<h2>Панел на Модератор</h2><p>Здравей, ${req.user.name}</p>`)
})

// Администраторски панел
router.get('/admin', ensureRole('admin'), (req, res) => {
  res.send(`<h2>Администраторски Панел</h2><p>Здравей, ${req.user.name}</p>`)
})

export default router