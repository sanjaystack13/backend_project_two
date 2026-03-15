const axios = require('axios');
const express = require('express');
const server = express();
// For Mobile number OTP verification

// Nettyfish credentials and configurations
const clientKey = "bf8913c1-fb8a-43b6-be00-f36387e80dda";
const apiKey = "09574e8c-94d7-4309-a566-43faf0712d4f";
const uri = "http://139.99.131.165/api/v2/SendSMS?";
const senderId = "ELVADO";

// Object to store OTPs
const otps = {};

// Generate a random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Route to send OTP via SMS
server.post('/send-otp-sms', (req, res) => {
  const { number, appName } = req.body; // assuming appName is provided in the request

  // Generate a random OTP
  const otp = generateOTP();
console.log(otp)
  // Store the OTP in the otps object with the phone number as key
  otps[number] = otp;

  // Prepare the SMS content
  const template = `Dear user, Please enter the OTP ${otp} in ${appName} to continue. ELVADO`;
  const parameters = `${uri}SenderId=${senderId}&Message=${encodeURIComponent(template)}&MobileNumbers=${number}&ApiKey=${apiKey}&ClientId=${clientKey}`;

  // Send SMS using Nettyfish API
  axios.get(parameters)
    .then(response => {
      console.log('SMS sent successfully:', response.data);
      res.status(200).json({ message: 'OTP sent successfully',Number : number });
    })
    .catch(error => {
      console.error('Error sending SMS:', error);
      res.status(500).json({ error: 'Failed to send OTP', errorMessage: error.message });
    });
});


server.post('/verify-otp-sms', async (req, res) => {
  const { number, otp } = req.body;
console.log(number)
console.log(otp)
console.log(otps[number])


  try {
    // Check if the OTP matches the one stored for the phone number
    if (otp == otps[number]) {
      // OTP verification failed
      console.log('OTP verified successfully!');
    // Return a success message, the created user, and the token
    return res.status(200).json({ message: 'User verified' });
    }
    console.error('OTP verification failed');
    return res.status(400).json({ error: 'OTP verification failed' });
    
  } catch (error) {
    // If an error occurs during user creation, return a 500 status code and the error message
    console.error('Error during user creation:', error);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = server;