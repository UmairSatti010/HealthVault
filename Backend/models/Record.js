// models/Record.js
const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema(
  {
    bloodPressure: String,
    heartRate: String,
    bloodSugar: String,
    weight: String,
    height: String
  },
  { _id: false }
);

const recordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true },
    medicalHistory: { type: String, default: '' },
    doctorNotes: { type: String, default: '' },

    vitals: {
      type: vitalsSchema,
      default: {}
    },

    files: {
      labReport: { type: String, default: '' },
      prescription: { type: String, default: '' }
    }
  },
  { timestamps: true } // createdAt & updatedAt
);

module.exports = mongoose.model('Record', recordSchema);
