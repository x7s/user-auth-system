import express from 'express'
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.js';
import { listUsers } from '../controllers/userController.js'

const router = express.Router()

// Модераторски панел – преглед само
router.get('/users', isAuthenticated, authorizeRoles, listUsers)

router.get('/panel', isAuthenticated, authorizeRoles('moderator'), (req, res) => {
  res.send('Moderator panel');
});

export default router