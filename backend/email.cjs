const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: "rajeshravi67796@gmail.com",
    pass: "veyt iosn cobn jjpj"
  },
});

// Enhanced email endpoint with response handling
app.post('/send-email', async (req, res) => {
  const { recipientEmail, subject, text } = req.body;
  
  // Generate unique response links
  const responseLinks = {
    accept: `http://localhost:3001/handle-response?email=${encodeURIComponent(recipientEmail)}&response=accepted`,
    reject: `http://localhost:3001/handle-response?email=${encodeURIComponent(recipientEmail)}&response=rejected`
  };

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <p>${text}</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${responseLinks.accept}" 
           style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; margin-right: 15px;">
          Accept Request
        </a>
        <a href="${responseLinks.reject}" 
           style="background-color: #f44336; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px;">
          Reject Request
        </a>
      </div>
      <p style="color: #666; font-size: 0.9em;">
        If the buttons don't work, copy these links:<br>
        Accept: ${responseLinks.accept}<br>
        Reject: ${responseLinks.reject}
      </p>
    </div>
  `;

  const mailOptions = {
    from: '"Your Application" <rajeshravi67796@gmail.com>',
    to: recipientEmail,
    subject: subject,
    text: `${text}\n\nAccept: ${responseLinks.accept}\nReject: ${responseLinks.reject}`,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Response handling endpoint
app.get('/handle-response', async (req, res) => {
  const { email, response } = req.query;
  
  try {
    // Send confirmation email
    await transporter.sendMail({
      from: '"Your Application" <rajeshravi67796@gmail.com>',
      to: email,
      subject: `Request ${response}`,
      text: `Your response "${response}" has been recorded.`,
      html: `<p>Your response "<strong>${response}</strong>" has been recorded.</p>`
    });

    // Redirect to a thank-you page
    res.send(`
      <html>
        <body style="text-align: center; padding: 50px;">
          <h1>Thank you for your response!</h1>
          <p>We've recorded your choice: ${response}</p>
          <p>You can close this window now.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Response handling error:', error);
    res.status(500).send('Error processing your response');
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));