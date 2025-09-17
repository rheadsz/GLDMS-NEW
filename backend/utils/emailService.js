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

/**
 * Send email notification about sample submissions
 * @param {Object} projectData - The project data
 * @param {Array} samples - Array of sample details
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendSampleSubmissionEmail = async (projectData, samples) => {
  try {
    // Format the samples data for email
    let samplesHtml = '';
    
    samples.forEach((sample, index) => {
      samplesHtml += `
        <div style="margin-bottom: 15px; padding: 10px; background-color: #f5f5f5; border-left: 3px solid #007bff;">
          <p><strong>Sample ${index + 1}:</strong></p>
          <p><strong>Sample ID:</strong> ${sample.sampleId || 'N/A'}</p>
          <p><strong>Borehole ID:</strong> ${sample.boreholeId || 'N/A'}</p>
          <p><strong>Depth:</strong> ${sample.depthFrom || '0'} to ${sample.depthTo || '0'} ft</p>
          <p><strong>Container Type:</strong> ${sample.containerType || 'N/A'}</p>
          <p><strong>Quantity:</strong> ${sample.quantity || 'N/A'}</p>
          ${sample.tl101No ? `<p><strong>TL-101 Number:</strong> ${sample.tl101No}</p>` : ''}
          ${sample.fieldCollectionDate ? `<p><strong>Collection Date:</strong> ${sample.fieldCollectionDate}</p>` : ''}
        </div>
      `;
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: 'Rhea.Dsouza@dot.ca.gov',
      subject: 'Samples submitted to GLDMS',
      html: `
        <h2>Please find the following samples submitted to GLDMS:</h2>
        <div style="margin: 20px 0;">
          <p><strong>Project ID:</strong> ${projectData.projectID || 'N/A'}</p>
          <p><strong>EA:</strong> ${projectData.ea || 'N/A'}</p>
          <p><strong>Project Name:</strong> ${projectData.projectName || 'N/A'}</p>
          <p><strong>District:</strong> ${projectData.district || 'N/A'}</p>
        </div>
        <h3>Sample Details:</h3>
        ${samplesHtml}
        <p>This is an automated notification from the GLDMS system.</p>
      `
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);

    console.log('Sample submission email sent successfully:', result.messageId);

    return {
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Error sending sample submission email:', error);
    throw error;
  }
};

module.exports = {
  sendRequestNotifications,
  sendSampleSubmissionEmail
};
