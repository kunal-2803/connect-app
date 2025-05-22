const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewed: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meeting: {
    type: Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  feedback: String,
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', ReviewSchema);