
const nodemailer = require('nodemailer');

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to other services
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD // Your app password
    }
  });
};

const sendPDFEmail = async (req, res) => {
  try {
    const { email, subject, message, pdfData, fileName } = req.body;

    if (!email || !pdfData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and PDF data are required' 
      });
    }

    const transporter = createTransporter();

    // Convert base64 PDF data to buffer
    const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject || 'Orange Card PDF',
      text: message || 'Please find attached your Orange Card PDF.',
      attachments: [{
        filename: fileName || 'orange-card.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    await transporter.sendMail(mailOptions);

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
