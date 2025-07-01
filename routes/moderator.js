import express from 'express'
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.js';
import { listUsers } from '../controllers/userController.js'

const router = express.Router()

// Модераторски панел – преглед само
router.get('/users', isAuthenticated, authorizeRoles('moderator'), listUsers)

// И модератори, и администратори имат достъп
router.get('/moderator', isAuthenticated, authorizeRoles('moderator', 'admin'), (req, res) => {
  res.send(`<h1>Moderator Panel</h1><p>Добре дошъл, ${req.user.name}</p>`);
});

router.get('/moderator', isAuthenticated, authorizeRoles('moderator', 'admin'), (req, res) => {
  res.render('moderator', {
    title: 'Модераторски панел',
    user: req.user
  });
});

export default router