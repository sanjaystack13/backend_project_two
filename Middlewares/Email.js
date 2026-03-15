const nodemailer = require('nodemailer');
const express = require('express');
const server = express();

const generateOtp=()=>{
return Math.floor(100000 + Math.random() * 900000).toString();
}

const otpsend={};

server.post('/send-welcome-email',(req,res)=>{
const {email} = req.body;

const otp = generateOtp();

otpsend[email] = otp;

const transporter =  nodemailer.createTransport({
  service:"gmail",
  auth:{
    user:'prabakarsv7@gmail.com',
    pass:'tbvz rxad idac bwui',
  }
});

const mailOptions = {
  from: 'prabakarsv7@gmail.com',
  to: email,
  subject: 'Welcome to our Polling App!',
  text: `Welcome to our Polling App! Your OTP is: ${otp}. Please use this OTP to verify your email address.`
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  } else {
    console.log('Welcome email sent:', info.response);
    res.status(200).json({ message: 'Welcome email sent successfully' });
  }
});
});
// Route to verify OTP
server.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  // Check if the OTP matches the one stored for the email
  if (otp === otpsend[email]) {
    // OTP is verified
    console.log('OTP verified successfully!');
    res.status(200).json({ message: 'OTP verified successfully' });
  } else {
    // OTP verification failed
    console.error('OTP verification failed');
    res.status(400).json({ error: 'OTP verification failed' });
  }
});

module.exports = server;