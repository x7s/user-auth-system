import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();
router.use(isAuthenticated);

// Вземане на всички нотификации на текущия потребител, с опция за филтриране по прочетени/непрочетени
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { read } = req.query; // опционален филтър: read=true/false
    const filter = { user: req.user._id };
    if (read === 'true') filter.read = true;
    else if (read === 'false') filter.read = false;

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    res.status(500).send('Грешка при зареждане на нотификациите.');
  }
});

// Маркиране на една нотификация като прочетена
router.patch('/:id/read', isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Маркиране на всички нотификации като прочетени
router.patch('/read/all', isAuthenticated, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;