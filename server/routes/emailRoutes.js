
const express = require('express');
const router = express.Router();
const { sendPDFEmail } = require('../controllers/emailController');

// POST /api/email/send-pdf
router.post('/send-pdf', sendPDFEmail);

module.exports = router;
