const express =require("express");
const server = express.Router();
const session = require("express-session");
const { generateToken, passport } = require('../Middlewares/Passport');

require("dotenv").config();
server.use(session({
    secret:process.env.JWT_SECRET_KEY,
    resave:false,
    saveUninitialized:true
}));
server.use(passport.initialize());
server.use(passport.session());
server.get('/google',passport.authenticate('google',{scope:['profile','email']}));
const Usermodel = require('../Models/UserModel');
const jwt = require('jsonwebtoken')

server.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), async (req, res) => {
  console.log('Google OAuth User:', req.user);
  const { google_id, user_name, email } = req.user; // Using data from Google OAuth

  try {
    let existingUser = await Usermodel.findOne({ email });

if (existingUser) {
 // If the user already exists, return a message indicating the user exists
 console.log('user already exists');
 res.redirect(`http://localhost:3000/home?email=${existingUser.email}`);
}
else {
 // If the user does not exist, create a new user with Google OAuth data
 const newUser = new Usermodel({ googleID:google_id, user_name, email });

 // Generate JWT token
 const token = jwt.sign({ userId: newUser._id, email: newUser.email }, 'your-secret-key', { expiresIn: '1h' });

 // Save the user and token in the database
 newUser.token = token;
 await newUser.save();
 // Return a success message, the created user, and the token
//   res.status(201).json({ 
//     message: 'User created successfully', 
//     user: newUser, 
//     token
// });
// res.redirect('http://localhost:3000/layout');
// Retrieve the newly saved user's email from the database
const savedUser = await Usermodel.findOne({ email });

// Redirect to layout with email
res.redirect(`http://localhost:3000/googleuser?email=${savedUser.email}`);
}

} catch (error) {
// If an error occurs during user creation, return a 500 status code and the error message
res.status(500).json({ message: error.message });
}
});

server.get('/signout', (req, res) => {
  req.logout((err) => {
      if (err) {
          return res.status(500).json({ message: 'Error signing out' });
      }
      req.session.destroy((err) => {
          if (err) {
              return res.status(500).json({ message: 'Error destroying session' });
          }
          res.clearCookie('connect.sid'); // Clear the session cookie
          res.status(200); // Redirect to the login page or another appropriate route
      });
  });
});

module.exports =  server;