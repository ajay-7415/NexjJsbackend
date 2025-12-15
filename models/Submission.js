const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
    fieldId: {
        type: String,
        required: true
    },
    fieldLabel: {
        type: String,
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
});

const submissionSchema = new mongoose.Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true,
        index: true
    },
    responses: [responseSchema],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String
    }
});

module.exports = mongoose.model('Submission', submissionSchema);
