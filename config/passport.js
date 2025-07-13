import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { logLogin } from '../utils/logger.js';
import bcrypt from 'bcrypt'
import User from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()

// Локална стратегия (вход с имейл и парола)
passport.use(new LocalStrategy({
  usernameField: 'email',
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email })
    if (!user) return done(null, false, { message: 'Невалиден имейл' })

    if (!user.password) return done(null, false, { message: 'Този акаунт използва Google вход' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return done(null, false, { message: 'Грешна парола' })

    return done(null, user)
  } catch (err) {
    return done(err)
  }
}))

// Google стратегия
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ googleId: profile.id })
    if (existingUser) {
      await logLogin(existingUser, req.ip); // 🔥
      return done(null, existingUser);
    }

    // 👉 Генерирай уникално потребителско име
    let baseUsername = profile.displayName?.replace(/\s+/g, '').toLowerCase() || profile.emails[0].value.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter++}`;
    }

    const newUser = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      username, // 💡 Това беше причината за Mongo грешката
      role: 'user',
    });

    await logLogin(newUser, req.ip); // 🔥
    return done(null, newUser)
  } catch (err) {
    return done(err)
  }
}));

// Сериалиране / десериалиране
passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})