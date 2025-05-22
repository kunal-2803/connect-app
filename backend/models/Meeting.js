const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeetingSchema = new Schema({
  connection: {
    type: Schema.Types.ObjectId,
    ref: 'Connection',
    required: true
  },
  proposedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  details: String,
  status: {
    type: String,
    enum: ['proposed', 'accepted', 'completed', 'canceled'],
    default: 'proposed'
  },
  acceptedBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    acceptedAt: {
      type: Date
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Meeting', MeetingSchema);