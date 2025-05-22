const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  age: {
    primaryAge: {
      type: Number,
      required: true
    },
    secondaryAge: {
      type: Number
    }
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    city: String,
    state: String,
    country: String
  },
  photoVerified: {
    type: Boolean,
    default: false
  },
  idVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: String,
  verificationPhotos: [{
    url: String,
    approved: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  interests: [String],
  isPremium: {
    type: Boolean,
    default: false
  },
  lookingFor: {
    type: String,
    enum: ['Casual', 'Ongoing', 'Friendship','Couple Seeking Bull', 'Other']
  },
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Experienced']
  },
  experienceCount: {
    type: Number,
    default: 0
  },
  healthStatus: {
    declared: {
      type: Boolean,
      default: false
    },
    lastTestedDate: Date
  },
  bio: String,
  preferences: {
    ageRange: {
      min: Number,
      max: Number
    },
    distance: Number,
    interests: [String]
  },
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
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

// Add geospatial index for location-based queries
ProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Profile', ProfileSchema);