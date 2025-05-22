const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Profile = require('../models/Profile');
const Meeting = require('../models/Meeting');
const Connection = require('../models/Connection');

// @route   POST api/reviews/:user_id
// @desc    Create a review for a user
// @access  Private
router.post('/:user_id', [
  auth,
  [
    check('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('feedback', 'Feedback cannot exceed 500 characters').isLength({ max: 500 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { rating, feedback, meetingId, isPublic = true } = req.body;
    
    // Verify there is a completed meeting between the users
    if (meetingId) {
      const meeting = await Meeting.findById(meetingId).populate('connection');
      
      if (!meeting) {
        return res.status(404).json({ msg: 'Meeting not found' });
      }
      
      if (meeting.status !== 'completed') {
        return res.status(400).json({ msg: 'Cannot review: meeting is not completed' });
      }
      
      const connection = meeting.connection;
      
      // Verify both users are part of the connection
      const userIsPartOfConnection = 
        connection.requester.toString() === req.user.id || 
        connection.recipient.toString() === req.user.id;
      
      const reviewedIsPartOfConnection = 
        connection.requester.toString() === req.params.user_id || 
        connection.recipient.toString() === req.params.user_id;
      
      if (!userIsPartOfConnection || !reviewedIsPartOfConnection) {
        return res.status(401).json({ msg: 'Not authorized to review this user' });
      }
    } else {
      // Check if there's any completed meeting between the users
      const connections = await Connection.find({
        $or: [
          { requester: req.user.id, recipient: req.params.user_id },
          { requester: req.params.user_id, recipient: req.user.id }
        ],
        status: 'accepted'
      });
      
      if (connections.length === 0) {
        return res.status(400).json({ msg: 'Cannot review: no connection with this user' });
      }
      
      const connectionIds = connections.map(conn => conn._id);
      
      const completedMeeting = await Meeting.findOne({
        connection: { $in: connectionIds },
        status: 'completed'
      });
      
      if (!completedMeeting) {
        return res.status(400).json({ msg: 'Cannot review: no completed meeting with this user' });
      }
    }
    
    // Check if user has already reviewed this person
    const existingReview = await Review.findOne({
      reviewer: req.user.id,
      reviewed: req.params.user_id
    });
    
    if (existingReview) {
      return res.status(400).json({ msg: 'You have already reviewed this user' });
    }
    
    // Create review
    const review = new Review({
      reviewer: req.user.id,
      reviewed: req.params.user_id,
      meeting: meetingId,
      rating,
      feedback,
      isPublic
    });
    
    await review.save();
    
    // Update profile rating
    const profile = await Profile.findOne({ user: req.params.user_id });
    
    if (profile) {
      const reviews = await Review.find({ reviewed: req.params.user_id });
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      profile.averageRating = averageRating;
      profile.reviewCount = reviews.length;
      await profile.save();
    }
    
    res.json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/user/:user_id
// @desc    Get reviews for a user
// @access  Private
router.get('/user/:user_id', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ 
      reviewed: req.params.user_id,
      isPublic: true
    })
    .populate('reviewer', 'username')
    .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/my-reviews
// @desc    Get reviews written by the user
// @access  Private
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user.id })
      .populate('reviewed', 'username')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;