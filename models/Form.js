const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'textarea', 'dropdown', 'checkbox', 'radio', 'date', 'file']
    },
    label: {
        type: String,
        required: true
    },
    required: {
        type: Boolean,
        default: false
    },
    options: [{
        type: String
    }],
    order: {
        type: Number,
        required: true
    }
});

const formSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Form title is required'],
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fields: [fieldSchema],
    uniqueUrl: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
formSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Form', formSchema);
