import Notification from '../models/Notification.js';

/**
 * Създава и записва нова нотификация за даден потребител
 * @param {ObjectId} userId - ID на потребителя
 * @param {String} message - Текст на съобщението
 * @param {String} type - Тип на нотификацията: info, success, warning, danger, system (по подразбиране 'info')
 * @returns {Promise<Notification>}
 */
const sendNotification = async (userId, message, type = 'info') => {
  try {
    const notification = new Notification({
      user: userId,
      message,
      type,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export default sendNotification;