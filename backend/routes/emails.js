const express = require('express');
const router = express.Router();
const { sendSampleSubmissionEmail } = require('../utils/emailService');

module.exports = (db) => {
  /**
   * @route POST /api/emails/submit-samples
   * @desc Send email notification for sample submission
   */
  router.post('/submit-samples', async (req, res) => {
    try {
      const { projectData, samples } = req.body;

      if (!projectData || !samples || !Array.isArray(samples) || samples.length === 0) {
        return res.status(400).json({ 
          message: 'Invalid request. Project data and samples array are required.'
        });
      }

      // Send the email
      const emailResult = await sendSampleSubmissionEmail(projectData, samples);

      res.status(200).json({
        message: 'Sample submission email sent successfully',
        messageId: emailResult.messageId
      });
    } catch (error) {
      console.error('Error sending sample submission email:', error);
      res.status(500).json({ 
        message: 'Error sending sample submission email',
        error: error.message 
      });
    }
  });

  return router;
};
