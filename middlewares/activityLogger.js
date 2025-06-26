/* * activityLogger.js
 * оригинален код за Middleware for logging user activities like login and logout този файл трябва да се изтрие
 * Този файл съдържа middleware функции за логване на потребителски дейности които са прехвърлени и организирани в logger.js
 */
/*
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
*/