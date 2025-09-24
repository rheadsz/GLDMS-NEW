const nodemailer = require('nodemailer');

// Check if we're in test mode - forcing production mode
const isTestMode = false; // Force production mode to use real email

// Create a transporter object
let transporter;

// Function to create a test account and get transporter
async function createTestTransporter() {
  // Create a test account at ethereal.email
  try {
    // Create a SMTP transporter using the supplied credentials
    const testAccount = await nodemailer.createTestAccount();
    
    // Log test account credentials
    console.log('Test account created:', testAccount.user);
    console.log('Test account password:', testAccount.pass);
    
    // Create reusable transporter object using the default SMTP transport
    const tempTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    
    console.log('Test email transporter created');
    return tempTransporter;
  } catch (error) {
    console.error('Failed to create test account:', error);
    // Fallback to logging only
    return {
      sendMail: (mailOptions) => {
        return new Promise((resolve) => {
          console.log('\n==== TEST EMAIL WOULD BE SENT (FALLBACK) ====');
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          console.log('HTML Content:', mailOptions.html);
          console.log('================================\n');
          
          // Simulate successful sending
          resolve({ messageId: 'test-message-id-' + Date.now() });
        });
      }
    };
  }
}

// Initialize the transporter
const initializeTransporter = async () => {
  if (isTestMode) {
    // In test mode, use ethereal.email (a test SMTP service)
    console.log('Email service initializing in TEST MODE');
    return await createTestTransporter();
  } else {
    // In production mode, use real SMTP
    // Check if we should use Outlook or Gmail
    const useOutlook = process.env.EMAIL_SERVICE === 'outlook' || false;
    
    if (useOutlook) {
      // Outlook/Office365 configuration
      return nodemailer.createTransport({
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
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });
    }
  }
};

// Initialize the transporter immediately
(async () => {
  try {
    transporter = await initializeTransporter();
    console.log('Email transporter initialized successfully');
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
  }
})();

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
        <div style="margin-bottom: 15px; padding: 10px; background-color: #f5f5f5;">
          <p><strong>Sample ${index + 1}:</strong></p>
          <p><strong>Borehole ID:</strong> ${sample.boreholeId || 'N/A'}</p>
          <p><strong>Sample ID:</strong> ${sample.sampleId || 'N/A'}</p>
          <p><strong>Depth (ft) From/To:</strong> ${sample.depthFrom || '0'} to ${sample.depthTo || '0'}</p>
          <p><strong>Quantity:</strong> ${sample.quantity || 'N/A'}</p>
          <p><strong>Container Type:</strong> ${sample.containerType === 'Tube' ? 'Tube (✓) Jar ()' : 'Tube () Jar (✓)'}</p>
          ${sample.tl101No ? `<p><strong>TL-101 Number:</strong> ${sample.tl101No}</p>` : ''}
          ${sample.fieldCollectionDate ? `<p><strong>Collection Date:</strong> ${sample.fieldCollectionDate}</p>` : ''}
        </div>
      `;
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER || 'gldmsproject@outlook.com',
      to: 'Rhea.Dsouza@dot.ca.gov',
      subject: 'Samples submitted to GLDMS',
      html: `
        <h2>Please find the following samples submitted to GLDMS:</h2>
        <div style="margin: 20px 0;">
          <p><strong>Project ID:</strong> ${projectData.projectID || 'N/A'}</p>
          <p><strong>EA:</strong> ${projectData.ea || 'N/A'}</p>
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
