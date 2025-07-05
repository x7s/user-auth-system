import express from 'express'
import { isAuthenticated, ensureRole, ensureRoles } from '../middlewares/auth.js'
import { logRouteAccess } from '../middlewares/loggerMiddleware.js';

const router = express.Router()

// Общ потребителски dashboard
router.get('/dashboard', isAuthenticated, logRouteAccess('Достъп до потребителското табло'), (req, res) => {
  res.render('dashboard', {
    title: 'Табло',
    user: req.user
  });
});

export default router