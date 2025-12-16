const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
const Form = require('../models/Form');
const auth = require('../middleware/auth');

// @route   POST /api/forms
// @desc    Create a new form
// @access  Private
router.post('/', auth, [
    body('title').trim().notEmpty().withMessage('Form title is required'),
    body('fields').isArray().withMessage('Fields must be an array')
], async (req, res) => {
    try {
        console.log('📝 Create form request received');
        console.log('User ID:', req.userId);
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { title, fields } = req.body;

        // Generate unique URL
        const uniqueUrl = nanoid(10);
        console.log('Generated unique URL:', uniqueUrl);

        const form = new Form({
            title,
            userId: req.userId,
            fields,
            uniqueUrl
        });

        console.log('Attempting to save form...');
        await form.save();
        console.log('✅ Form saved successfully!');

        res.status(201).json({
            success: true,
            form
        });
    } catch (error) {
        console.error('❌ Create form error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error while creating form',
            error: error.message
        });
    }
});

// @route   GET /api/forms
// @desc    Get all forms for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const forms = await Form.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .select('-__v');

        res.json({
            success: true,
            forms
        });
    } catch (error) {
        console.error('Get forms error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching forms'
        });
    }
});

// @route   GET /api/forms/:id
// @desc    Get a specific form by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const form = await Form.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        res.json({
            success: true,
            form
        });
    } catch (error) {
        console.error('Get form error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching form'
        });
    }
});

// @route   GET /api/forms/public/:uniqueUrl
// @desc    Get form by unique URL (public access)
// @access  Public
router.get('/public/:uniqueUrl', async (req, res) => {
    try {
        const form = await Form.findOne({ uniqueUrl: req.params.uniqueUrl })
            .select('-userId -__v');

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        res.json({
            success: true,
            form
        });
    } catch (error) {
        console.error('Get public form error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching form'
        });
    }
});

// @route   PUT /api/forms/:id
// @desc    Update a form
// @access  Private
router.put('/:id', auth, [
    body('title').optional().trim().notEmpty().withMessage('Form title cannot be empty'),
    body('fields').optional().isArray().withMessage('Fields must be an array')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { title, fields } = req.body;

        // Find form and verify ownership
        const form = await Form.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        // Update fields
        if (title) form.title = title;
        if (fields) form.fields = fields;

        await form.save();

        res.json({
            success: true,
            form
        });
    } catch (error) {
        console.error('Update form error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating form'
        });
    }
});

// @route   DELETE /api/forms/:id
// @desc    Delete a form
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const form = await Form.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        res.json({
            success: true,
            message: 'Form deleted successfully'
        });
    } catch (error) {
        console.error('Delete form error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting form'
        });
    }
});

module.exports = router;
