import Log from '../models/Log.js'
import User from '../models/User.js'

// Взимане на всички логове (с най-новите първо)
export const getAllLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('user', 'email role')
      .sort({ timestamp: -1 })

    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: 'Грешка при взимане на логовете.' })
  }
}

// Взимане на логове по потребител
export const getLogsByUser = async (req, res) => {
  try {
    const logs = await Log.find({ user: req.params.userId })
      .populate('user', 'email role')
      .sort({ timestamp: -1 })

    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: 'Грешка при взимане на логовете по потребител.' })
  }
}

// Взимане на логове по действие (login, logout, profile_update и др.)
export const getLogsByAction = async (req, res) => {
  try {
    const logs = await Log.find({ action: req.params.action })
      .populate('user', 'email role')
      .sort({ timestamp: -1 })

    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: 'Грешка при взимане на логовете по действие.' })
  }
}