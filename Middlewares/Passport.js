const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo', // Include this line to access user profile
    scope: ['profile', 'email'] // Add 'email' scope to request access to user's email
  }, (accessToken, refreshToken, profile, done) => {
    const user = {
      google_id: profile.id,
      user_name: profile.displayName,
      email: profile.emails[0].value // Retrieve email address
    };
    done(null, user);
  }));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const generateToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET);
};

module.exports = { passport, generateToken };
