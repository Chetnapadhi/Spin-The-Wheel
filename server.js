const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  next();
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/wheel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'wheel.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Spin endpoint
app.post('/api/spin', async (req, res) => {
  try {
    const { name, email, phone, domain, discount, couponCode } = req.body;

    if (!name || !email || !phone || !domain || !discount || !couponCode) {
      return res.status(400).json({ 
        allowed: false, 
        message: 'Missing required fields' 
      });
    }

    // Send email
    try {
      await sendCouponEmail(name, email, domain, discount, couponCode);
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    // Send SMS
    try {
      await sendCouponSMS(name, phone, domain, discount, couponCode);
    } catch (smsError) {
      console.error('SMS error:', smsError);
    }

    res.json({
      allowed: true,
      message: 'Coupon sent successfully!',
      couponCode: couponCode
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      allowed: false, 
      message: 'Internal server error' 
    });
  }
});

// Email function
async function sendCouponEmail(name, email, domain, discount, couponCode) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🎉 Your ${discount} Discount Code from ZooTechX!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations, ${name}! 🎊</h2>
        <p>You've won a <strong>${discount}</strong> discount on our ${domain} services!</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0; color: #333;">Your Coupon Code:</h3>
          <p style="font-size: 24px; font-weight: bold; color: #4CAF50; margin: 10px 0;">${couponCode}</p>
        </div>
        <p>Use this code at checkout to claim your discount!</p>
        <p>Best regards,<br>The ZooTechX Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// SMS function
async function sendCouponSMS(name, phone, domain, discount, couponCode) {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Hi ${name}! You won ${discount} off ${domain} services! Code: ${couponCode}. -ZooTechX`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
