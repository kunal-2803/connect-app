const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { sendVerificationEmail, sendRejectionEmail } = require('../utils/emailService');

const UserSchema = new Schema({
  accountType: {
    type: String,
    enum: ['Couple', 'Bull'],
    required: false
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  googleId: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isRejected: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Add middleware to handle isVerified and isRejected changes
UserSchema.pre('save', async function(next) {
  // Check if isVerified is being modified and is being set to true
  if (this.isModified('isVerified') && this.isVerified) {
    try {
      await sendVerificationEmail(this.email);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  }

  // Check if isRejected is being modified and is being set to true
  if (this.isModified('isRejected') && this.isRejected) {
    try {
      await sendRejectionEmail(this.email, this.rejectionReason);
    } catch (error) {
      console.error('Failed to send rejection email:', error);
    }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);