
const nodemailer = require('nodemailer');

// Configure email transporter
const createTransporter = () => {
  console.log('Creating email transporter with config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER ? 'Set' : 'Not set',
    pass: process.env.SMTP_PASS ? 'Set' : 'Not set'
  });

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendPDFEmail = async (req, res) => {
  try {
    console.log('Sending PDF email request received');
    const { email, subject, message, pdfData, fileName } = req.body;

    if (!email || !pdfData) {
      console.log('Missing required fields - email or pdfData');
      return res.status(400).json({ 
        success: false, 
        message: 'Email and PDF data are required' 
      });
    }

    // Check if email configuration is available
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email configuration missing - SMTP_USER or SMTP_PASS not set');
      return res.status(500).json({
        success: false,
        message: 'Email service not configured. Please contact administrator.'
      });
    }

    const transporter = createTransporter();

    // Convert base64 PDF data to buffer
    const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64');
    console.log('PDF buffer created, size:', pdfBuffer.length);

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: subject || 'Orange Card PDF',
      text: message || 'Please find attached your Orange Card PDF.',
      attachments: [{
        filename: fileName || 'orange-card.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    console.log('Sending email to:', email);
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    res.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

module.exports = {
  sendPDFEmail
};
