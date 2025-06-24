import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'Gmail', // или друг mail service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendVerificationEmail(user, verificationToken) {
  const verifyUrl = `${process.env.BASE_URL}/auth/verify-email?token=${verificationToken}`

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Потвърждение на имейл адрес',
    html: `<p>Здравейте, ${user.name || user.username}!</p>
           <p>Моля, потвърдете своя имейл, като кликнете на следния линк:</p>
           <a href="${verifyUrl}">${verifyUrl}</a>
           <p>Ако не сте направили тази заявка, можете да игнорирате този имейл.</p>`,
  }

  return transporter.sendMail(mailOptions)
}