require('dotenv').config();
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Profile = require('../models/Profile');
const User = require('../models/User');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   GET api/profiles/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/profiles
// @desc    Create or update user profile
// @access  Private
router.post('/', [
  auth,
  [
    check('displayName', 'Display name is required').not().isEmpty(),
    check('age.primaryAge', 'Age is required').isNumeric(),
    check('location.coordinates', 'Location is required').isArray()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    displayName,
    age,
    location,
    interests,
    lookingFor,
    experienceLevel,
    experienceCount,
    healthStatus,
    bio,
    preferences
  } = req.body;
  
  // Build profile object
  const profileFields = {
    user: req.user.id,
    displayName,
    age,
    location,
    interests,
    lookingFor,
    experienceLevel,
    experienceCount: experienceCount || 0,
    healthStatus,
    bio,
    preferences,
    updatedAt: Date.now()
  };
  
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      
      return res.json(profile);
    }
    
    // Create
    profile = new Profile(profileFields);
    await profile.save();
    
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/profiles/upload-profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/upload-profile-picture', [auth, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No image uploaded' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'profile_pictures',
      resource_type: 'image'
    });
    
    // Update profile
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: { profilePicture: result.secure_url } },
      { new: true }
    );
    
    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    
    res.json({ url: result.secure_url, profile });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/profiles/upload-verification-photos
// @desc    Upload verification photos
// @access  Private
router.post('/upload-verification-photos', [auth, upload.array('images', 5)], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No images uploaded' });
    }

    const uploadPromises = req.files.map(file => {
      // Convert buffer to base64
      const b64 = Buffer.from(file.buffer).toString('base64');
      let dataURI = 'data:' + file.mimetype + ';base64,' + b64;
      
      // Upload to Cloudinary
      return cloudinary.uploader.upload(dataURI, {
        folder: 'verification_photos',
        resource_type: 'image'
      });
    });
    
    const results = await Promise.all(uploadPromises);
    
    // Update profile with new verification photos
    const verificationPhotos = results.map(result => ({
      url: result.secure_url,
      approved: false,
      sharedWith: []
    }));
    
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $push: { verificationPhotos: { $each: verificationPhotos } } },
      { new: true }
    );
    
    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    
    res.json({ photos: profile.verificationPhotos });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/profiles
// @desc    Get all profiles with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { lat, lng, distance, minAge, maxAge, interests, page = 1, limit = 10, username } = req.query;
    
    let query = {};
    
    // Username search (case-insensitive partial match)
    if (username) {
      // Join with users collection to search by username
      const users = await User.find({
        username: { $regex: username, $options: 'i' }
      }).select('_id');
      
      query['user'] = { 
        $in: users.map(user => user._id),
        $ne: req.user.id // Still exclude current user
      };
    } else {
      // If no username search, just exclude current user
      query['user'] = { $ne: req.user.id };
    }
    
    // Location-based filtering
    if (lat && lng) {
      const coordinates = [parseFloat(lng), parseFloat(lat)];
      const maxDistance = distance ? parseInt(distance) * 1000 : 50000; // Convert km to meters
      
      query['location'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: maxDistance
        }
      };
    }
    
    // Age filtering
    if (minAge || maxAge) {
      query['age.primaryAge'] = {};
      
      if (minAge) query['age.primaryAge'].$gte = parseInt(minAge);
      if (maxAge) query['age.primaryAge'].$lte = parseInt(maxAge);
    }
    
    // Interest filtering
    if (interests) {
      const interestArray = interests.split(',');
      query['interests'] = { $in: interestArray };
    }

    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const totalProfiles = await Profile.countDocuments(query);
    
    // Get paginated profiles
    const profiles = await Profile.find(query)
      .populate('user', ['username', 'accountType', 'isVerified'])
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);
    
    // Prepare pagination metadata
    const totalPages = Math.ceil(totalProfiles / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      profiles,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProfiles,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/profiles/search/:username
// @desc    Search profiles by username
// @access  Private
router.get('/search/:username', auth, async (req, res) => {
  try {
    const username = req.params.username;
    
    // Find users with matching username (case-insensitive partial match)
    const users = await User.find({
      username: { $regex: username, $options: 'i' }
    }).select('_id username isVerified accountType');

    // Get profiles for found users
    const profiles = await Profile.find({
      user: { 
        $in: users.map(user => user._id),
        $ne: req.user.id // Exclude current user
      }
    }).populate('user', ['username', 'accountType', 'isVerified']);

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/profiles/user/:user_id
// @desc    Get profile by user ID
// @access  Private
router.get('/user/:user_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id })
      .populate('user', ['username', 'accountType', 'isVerified']);
    
    if (!profile) return res.status(400).json({ msg: 'Profile not found' });
    
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;