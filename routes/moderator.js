import express from 'express'
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.js';
import { listUsers } from '../controllers/userController.js'

const router = express.Router()

// Модераторски панел – преглед само
router.get('/users', isAuthenticated, authorizeRoles('moderator'), listUsers)

router.get('/panel', isAuthenticated, authorizeRoles('moderator'), (req, res) => {
  res.send(`<h1>Moderator Panel</h1><p>Здравей, ${req.user.name}</p>`);
});

export default router