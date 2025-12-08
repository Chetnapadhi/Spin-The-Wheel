const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { name, email, phone, domain, discount, couponCode } = JSON.parse(event.body);

    if (!name || !email || !phone || !domain || !discount || !couponCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ allowed: false, message: 'Missing required fields' })
      };
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ allowed: true, success: true, message: 'Coupon sent successfully!' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ allowed: false, success: false, message: 'An error occurred' })
    };
  }
};

async function sendCouponEmail(name, email, domain, discount, couponCode) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail not configured');
    return { success: false };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const textContent = `Hi ${name}!\n\nCongratulations! You just won ${discount}% OFF on ${domain} services from ZooTechX!\n\nYOUR COUPON CODE: ${couponCode}\n\nHow to Redeem:\n1. Visit the ZooTechX booth at the event\n2. Show this email or mention your coupon code\n3. Get your exclusive discount on ${domain}!\n\nThank you for participating!\n\nBest regards,\nZooTechX Team\nwww.zootechx.com`;

  // Get the logo URL - will be your Netlify site URL + /Logo.jpg
  const logoUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/Logo.jpg` : 'https://www.zootechx.com/logo.jpg';
  
  const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your ZooTechX Coupon</title></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f4;padding:20px 0;"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background:#000000;padding:30px;text-align:center;"><a href="https://www.zootechx.com" target="_blank" style="text-decoration:none;"><img src="${logoUrl}" alt="ZooTechX" style="max-width:250px;height:auto;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"><h1 style="color:#ffffff;margin:10px 0 0 0;font-size:28px;font-weight:bold;display:none;">ZooTechX</h1></a><p style="color:#888;margin:10px 0 0 0;font-size:14px;">Transforming Ideas into Digital Reality</p></td></tr><tr><td style="background:linear-gradient(135deg,#00d4ff 0%,#7b2dff 100%);padding:25px;text-align:center;"><h2 style="color:#ffffff;margin:0;font-size:24px;">🎉 Congratulations, ${name}!</h2></td></tr><tr><td style="padding:40px 30px;"><p style="color:#333;font-size:18px;margin:0 0 20px 0;text-align:center;">You just won <strong style="color:#00d4ff;font-size:24px;">${discount}% OFF</strong> on <strong>${domain}</strong> services!</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;"><tr><td align="center"><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8f9fa;border:2px dashed #00d4ff;border-radius:12px;padding:25px 40px;"><tr><td align="center"><p style="color:#666;font-size:12px;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:2px;">Your Coupon Code</p><p style="color:#1a1a2e;font-size:32px;font-weight:bold;margin:0;letter-spacing:3px;">${couponCode}</p></td></tr></table></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8f9fa;border-radius:8px;padding:20px;margin-top:20px;"><tr><td><h3 style="color:#1a1a2e;margin:0 0 15px 0;font-size:16px;">📋 How to Redeem</h3><p style="color:#555;margin:8px 0;font-size:14px;">1. Visit the ZooTechX booth at the event</p><p style="color:#555;margin:8px 0;font-size:14px;">2. Show this email or mention your coupon code</p><p style="color:#555;margin:8px 0;font-size:14px;">3. Get your exclusive discount on ${domain}!</p></td></tr></table></td></tr><tr><td style="background-color:#000000;padding:25px;text-align:center;"><a href="https://www.zootechx.com" target="_blank" style="text-decoration:none;"><img src="${logoUrl}" alt="ZooTechX" style="max-width:200px;height:auto;margin:0 0 10px 0;" onerror="this.style.display='none';"></a><p style="color:#888;font-size:12px;margin:0 0 10px 0;">Transforming Ideas into Digital Reality</p><p style="color:#00d4ff;font-size:12px;margin:0 0 10px 0;"><a href="https://www.zootechx.com" target="_blank" style="color:#00d4ff;text-decoration:none;">www.zootechx.com</a></p><p style="color:#666;font-size:11px;margin:0;">© 2025 ZooTechX. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`;

  const mailOptions = {
    from: { name: 'ZooTechX', address: process.env.GMAIL_USER },
    to: email,
    subject: `Your ZooTechX Coupon Code - ${discount}% OFF on ${domain}`,
    text: textContent,
    html: htmlContent,
    headers: {
      'X-Priority': '3',
      'X-Mailer': 'ZooTechX Promo System',
      'List-Unsubscribe': `<mailto:${process.env.GMAIL_USER}?subject=Unsubscribe>`
    }
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
  return { success: true };
}

async function sendCouponSMS(name, phone, domain, discount, couponCode) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE) {
    console.warn('Twilio not configured');
    return { success: false };
  }

  const message = `Hi ${name}! You just won ${discount}% off on ${domain} with ZooTechX. Your coupon code is ${couponCode}. Show this at the ZooTechX desk to redeem.`;
  
  let cleanPhone = phone.replace(/[+\s-]/g, '');
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) cleanPhone = cleanPhone.substring(2);
  if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
  const twilioPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;

  const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const twilioMessage = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: twilioPhone
  });

  console.log('SMS sent:', twilioMessage.sid);
  return { success: true };
}
