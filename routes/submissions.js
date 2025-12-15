const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Form = require('../models/Form');
const auth = require('../middleware/auth');

// @route   POST /api/submissions/:formId
// @desc    Submit a form response
// @access  Public
router.post('/:formId', [
    body('responses').isArray().withMessage('Responses must be an array')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { formId } = req.params;
        const { responses } = req.body;

        // Verify form exists
        const form = await Form.findById(formId);
        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        // Validate required fields
        const requiredFields = form.fields.filter(field => field.required);
        const submittedFieldIds = responses.map(r => r.fieldId);

        const missingFields = requiredFields.filter(
            field => !submittedFieldIds.includes(field.id)
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields: missingFields.map(f => f.label)
            });
        }

        // Get IP address
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        const submission = new Submission({
            formId,
            responses,
            ipAddress
        });

        await submission.save();

        res.status(201).json({
            success: true,
            message: 'Form submitted successfully',
            submission
        });
    } catch (error) {
        console.error('Submit form error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting form'
        });
    }
});

// @route   GET /api/submissions/form/:formId
// @desc    Get all submissions for a form
// @access  Private
router.get('/form/:formId', auth, async (req, res) => {
    try {
        const { formId } = req.params;

        // Verify form exists and user owns it
        const form = await Form.findOne({
            _id: formId,
            userId: req.userId
        });

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found or access denied'
            });
        }

        const submissions = await Submission.find({ formId })
            .sort({ submittedAt: -1 })
            .select('-__v');

        res.json({
            success: true,
            submissions,
            count: submissions.length
        });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching submissions'
        });
    }
});

module.exports = router;
