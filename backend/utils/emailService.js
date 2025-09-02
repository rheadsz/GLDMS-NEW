const nodemailer = require('nodemailer');

// Check if we're in test mode
const isTestMode = process.env.NODE_ENV !== 'production';

// Create a transporter object
let transporter;

if (isTestMode) {
  // In test mode, use ethereal.email (a test SMTP service)
  console.log('Email service running in TEST MODE - emails will be logged but not sent');
  
  // Create a preview-only transporter that logs instead of sending
  transporter = {
    sendMail: (mailOptions) => {
      return new Promise((resolve) => {
        console.log('\n==== TEST EMAIL WOULD BE SENT ====');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('HTML Content:', mailOptions.html);
        console.log('================================\n');
        
        // Simulate successful sending
        resolve({ messageId: 'test-message-id-' + Date.now() });
      });
    }
  };
} else {
  // In production mode, use real SMTP
  // Check if we should use Outlook or Gmail
  const useOutlook = process.env.EMAIL_SERVICE === 'outlook' || false;
  
  if (useOutlook) {
    // Outlook/Office365 configuration
    transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'your-email@outlook.com',
        pass: process.env.EMAIL_PASS || 'your-password'
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });
  } else {
    // Default to Gmail
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }
}

/**
 * Send email notification to requester and supervisor about a new test request
 * @param {Object} requestData - The request data
 * @param {number} requestId - The ID of the created request
 * @param {Array} testDetails - Array of test details
 * @returns {Promise} - Promise that resolves when emails are sent
 */
const sendRequestNotifications = async (requestData, requestId, testDetails) => {
  try {
    // We'll use simpler emails as requested

    // Email to requester - simple version as requested
    const requesterMailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: requestData.requesterEmail,
      subject: `Test Request #${requestId} Submitted Successfully`,
      html: `
        <h3>Test Request Confirmation</h3>
        <p>Dear ${requestData.requesterName},</p>
        <p>Your test request has been successfully submitted.</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p>Thank you for using GLDMS.</p>
      `
    };

    // Email to supervisor - simple version as requested
    const supervisorMailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: requestData.supervisorEmail,
      subject: `New Test Request #${requestId} Requires Your Attention`,
      html: `
        <h3>New Test Request</h3>
        <p>Dear ${requestData.supervisorName},</p>
        <p>You have a new test request to be viewed.</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Submitted by:</strong> ${requestData.requesterName}</p>
      `
    };

    // Send emails
    const requesterResult = await transporter.sendMail(requesterMailOptions);
    const supervisorResult = await transporter.sendMail(supervisorMailOptions);

    console.log('Emails sent successfully:', {
      requester: requesterResult.messageId,
      supervisor: supervisorResult.messageId
    });

    return {
      requester: requesterResult.messageId,
      supervisor: supervisorResult.messageId
    };
  } catch (error) {
    console.error('Error sending email notifications:', error);
    throw error;
  }
};

module.exports = {
  sendRequestNotifications
};
