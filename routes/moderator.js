import express from 'express'
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.js';
import { logRouteAccess } from '../middlewares/loggerMiddleware.js';
import { listUsers } from '../controllers/userController.js'

const router = express.Router()

// Модераторски панел – преглед само за модератори и администратори
router.get('/users', isAuthenticated, authorizeRoles('admin', 'moderator'), listUsers)

// И модератори, и администратори имат достъп
router.get('/', isAuthenticated, authorizeRoles('moderator', 'admin'), logRouteAccess('Модераторски панел'), (req, res) => {
  res.render('moderator', {
    title: 'Модераторски панел',
    user: req.user
  });
});

export default router