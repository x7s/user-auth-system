import User from '../models/User.js'
import bcrypt from 'bcryptjs'

// Преглед на текущ профил (вече имаме в userController, но може да дублираме или импортираме)
export const getAccountSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Грешка при зареждане на профил' })
  }
}

// Актуализиране на име и email
export const updateAccountInfo = async (req, res) => {
  try {
    const { name, email } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })

    // Проверка за промяна на email и дали не съществува вече
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) {
        return res.status(400).json({ error: 'Email вече се използва' })
      }
      user.email = email
    }
    if (name) user.name = name

    await user.save()
    res.json({ message: 'Информацията е актуализирана успешно' })
  } catch (error) {
    res.status(500).json({ error: 'Грешка при актуализацията' })
  }
}

// Смяна на парола
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Всички полета са задължителни' })
    }

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Текущата парола е грешна' })
    }

    // Хеширане на новата парола
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()

    res.json({ message: 'Паролата е успешно променена' })
  } catch (error) {
    res.status(500).json({ error: 'Грешка при смяна на парола' })
  }
}