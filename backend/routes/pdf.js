const express = require('express');
const router = express.Router();
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

// Generate test form PDF
router.post('/generate-test-form', async (req, res) => {
  try {
    const { testRows, projectInfo, boreholes, samples } = req.body;

    // Filter test rows that have Sand Equivalent or Corrosion
    const relevantTests = testRows.filter(row => 
      row.tests && (row.tests.includes('Sand Equivalent') || row.tests.includes('Corrosion'))
    );

    if (relevantTests.length === 0) {
      return res.status(400).json({ message: 'No Sand Equivalent or Corrosion tests found' });
    }

    const pdfBuffers = [];

    // Generate a PDF for each relevant test row
    for (const testRow of relevantTests) {
      // Find the associated sample based on boreholeSample string
      const boreholeSampleStr = testRow.boreholeSample; // Format: "boreholeId - depthFrom-depthTo"
      
      // Parse borehole ID from the string
      const boreholeId = boreholeSampleStr ? boreholeSampleStr.split(' - ')[0] : null;
      
      // Find the borehole
      const borehole = boreholes.find(b => b.boreholeId === boreholeId);
      
      // Find the sample associated with this borehole
      const sample = samples.find(s => s.boreholeId === boreholeId);

      if (!sample || !borehole) {
        console.warn(`Could not find sample or borehole for test row ${testRow.id}`);
        continue;
      }

      // Load the template PDF
      const templatePath = path.join(__dirname, '../../Other/test-form.pdf');
      const existingPdfBytes = await fs.readFile(templatePath);
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      // Get all field names
      const fields = form.getFields();
      console.log(`Available PDF fields (Total: ${fields.length}):`);
      
      if (fields.length === 0) {
        console.log('WARNING: No form fields found in PDF. The PDF may not be a fillable form.');
      } else {
        fields.forEach((field, index) => {
          const fieldType = field.constructor.name;
          console.log(`Field ${index + 1}: Name: "${field.getName()}" | Type: ${fieldType}`);
        });
      }

      // Prepare data for each field based on the order you specified
      const fieldData = [
        projectInfo.ea || '',                                                    // Field 1: EA number
        sample.containerType || '',                                              // Field 2: Tube or Jar
        projectInfo.projectName || '',                                           // Field 3: Project Name
        `${sample.boreholeId || ''} - ${sample.sampleId || ''}`,               // Field 4: BoreholeID - SampleID
        sample.depthFrom && sample.depthTo ? `${sample.depthFrom}-${sample.depthTo}` : (sample.depthFrom || sample.depthTo || ''), // Field 5: Depth
        borehole.latitude && borehole.longitude ? `${borehole.latitude}, ${borehole.longitude}` : '', // Field 6: Lat/Long
        testRow.tests.includes('Sand Equivalent') ? 'Sand Equivalent' : 'Corrosion', // Field 7: Test name
        sample.fieldCollectionDate || '',                                        // Field 8: Date sampled
        `${projectInfo.district || ''}, ${projectInfo.county || ''}, ${projectInfo.route || ''}, ${projectInfo.pmStart || ''}-${projectInfo.pmEnd || ''}`, // Field 9: Dist, County, Route, PM
        projectInfo.projectID || '',                                             // Field 10: Project ID
        projectInfo.requesterName || 'Rhea'                                      // Field 11: User name
      ];

      // Fill the fields in order
      console.log('Filling fields with data...');
      fields.forEach((field, index) => {
        try {
          if (field.constructor.name === 'PDFTextField') {
            const textField = form.getTextField(field.getName());
            textField.setText(fieldData[index] || '');
            console.log(`✓ Field ${index + 1} (${field.getName()}): "${fieldData[index]}"`);
          } else if (field.constructor.name === 'PDFCheckBox') {
            // If there's a checkbox, check it (assuming it's HDQTRS. LAB)
            const checkBox = form.getCheckBox(field.getName());
            checkBox.check();
            console.log(`✓ Checkbox ${index + 1} (${field.getName()}): Checked`);
          }
        } catch (e) {
          console.log(`✗ Error filling field ${index + 1} (${field.getName()}):`, e.message);
        }
      });

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Determine test type for filename
      const testType = testRow.tests.includes('Sand Equivalent') ? 'SandEquivalent' : 'Corrosion';
      
      pdfBuffers.push({
        buffer: Buffer.from(pdfBytes),
        filename: `${testType}_${boreholeId}_${Date.now()}.pdf`
      });
    }

    // For now, send back the first PDF (we'll handle multiple PDFs in a zip later if needed)
    if (pdfBuffers.length > 0) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfBuffers[0].filename}"`);
      res.send(pdfBuffers[0].buffer);
    } else {
      res.status(404).json({ message: 'No PDFs could be generated' });
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

module.exports = router;
