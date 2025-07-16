import express from 'express'
import Log from '../models/Log.js';
import { isAuthenticated } from '../middlewares/auth.js'
import { getProfile } from '../controllers/userController.js'

const router = express.Router()
router.use(isAuthenticated);

// Профил на текущия потребител
router.get('/profile', isAuthenticated, getProfile)

// GET /user/activity
router.get('/activity', async (req, res) => {
  try {
    const userId = req.user._id;
    const logs = await Log.find({ userId }).sort({ timestamp: -1 }).limit(50); // последните 50 действия
    res.json(logs);
  } catch (error) {
    console.error('Грешка при зареждане на активност:', error);
    res.status(500).send('Грешка при зареждане на активността');
  }
});

export default router