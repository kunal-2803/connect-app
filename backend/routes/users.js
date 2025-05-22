const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const Profile = require('../models/Profile');

// Middleware to ensure user is authenticated
const isAuthenticated = passport.authenticate('jwt', { session: false });

// @route   GET api/users/me
// @desc    Get current user's information
// @access  Private
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/users/me
// @desc    Update user information
// @access  Private
router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Check if username is already taken
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Check if email is already taken
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Email already taken' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/users/search
// @desc    Search users based on criteria
// @access  Private
router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const { query, accountType } = req.query;
    const searchQuery = {};

    if (query) {
      searchQuery.username = { $regex: query, $options: 'i' };
    }

    if (accountType) {
      searchQuery.accountType = accountType;
    }

    // Exclude current user from search results
    searchQuery._id = { $ne: req.user.id };

    const users = await User.find(searchQuery)
      .select('username accountType isVerified')
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username accountType isVerified createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/users/me
// @desc    Delete user account
// @access  Private
router.delete('/me', isAuthenticated, async (req, res) => {
  try {
    // Delete user's profile
    await Profile.findOneAndDelete({ user: req.user.id });
    
    // Delete user
    await User.findByIdAndDelete(req.user.id);

    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 