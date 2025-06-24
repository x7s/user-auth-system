import ActivityLog from '../models/ActivityLog.js';

export const logLogin = async (req, res, next) => {
  if (req.user) {
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'login',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (err) {
      console.error('Failed to log login activity:', err);
    }
  }
  next();
};

export const logLogout = async (req, res, next) => {
  if (req.user) {
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'logout',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (err) {
      console.error('Failed to log logout activity:', err);
    }
  }
  next();
};