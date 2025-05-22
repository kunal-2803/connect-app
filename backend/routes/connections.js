const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Connection = require('../models/Connection');
const User = require('../models/User');
const Profile = require('../models/Profile');

// @route   POST api/connections/request/:user_id
// @desc    Send connection request to a user
// @access  Private
router.post('/request/:user_id', auth, async (req, res) => {
  try {
    // Check if user exists
    const recipientUser = await User.findById(req.params.user_id);
    if (!recipientUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if connection already exists
    let connection = await Connection.findOne({
      $or: [
        { requester: req.user.id, recipient: req.params.user_id },
        { requester: req.params.user_id, recipient: req.user.id }
      ]
    });
    
    if (connection) {
      return res.status(400).json({ msg: 'Connection already exists' });
    }
    
    // Create new connection
    connection = new Connection({
      requester: req.user.id,
      recipient: req.params.user_id,
      status: 'pending'
    });
    
    await connection.save();
    
    res.json(connection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/connections/:connection_id/accept
// @desc    Accept a connection request
// @access  Private
router.put('/:connection_id/accept', auth, async (req, res) => {
  try {
    let connection = await Connection.findById(req.params.connection_id);
    
    if (!connection) {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    
    // Verify recipient is the current user
    if (connection.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update connection status
    connection = await Connection.findByIdAndUpdate(
      req.params.connection_id,
      { $set: { status: 'accepted', updatedAt: Date.now() } },
      { new: true }
    );
    
    res.json(connection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/connections/:connection_id/reject
// @desc    Reject a connection request
// @access  Private
router.put('/:connection_id/reject', auth, async (req, res) => {
  try {
    let connection = await Connection.findById(req.params.connection_id);
    
    if (!connection) {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    
    // Verify recipient is the current user
    if (connection.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update connection status
    connection = await Connection.findByIdAndUpdate(
      req.params.connection_id,
      { $set: { status: 'rejected', updatedAt: Date.now() } },
      { new: true }
    );
    
    res.json(connection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/connections/:connection_id/block
// @desc    Block a connection
// @access  Private
router.put('/:connection_id/block', auth, async (req, res) => {
  try {
    let connection = await Connection.findById(req.params.connection_id);
    
    if (!connection) {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    
    // Verify user is part of the connection
    if (connection.recipient.toString() !== req.user.id && connection.requester.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update connection status
    connection = await Connection.findByIdAndUpdate(
      req.params.connection_id,
      { $set: { status: 'blocked', updatedAt: Date.now() } },
      { new: true }
    );
    
    res.json(connection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/connections
// @desc    Get all user's connections
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id }
      ]
    })
    .populate('requester', 'username')
    .populate('recipient', 'username');
    
    res.json(connections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/connections/active
// @desc    Get all active connections (accepted status)
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id }
      ],
      status: 'accepted'
    })
    .populate('requester', ['username', 'accountType'])
    .populate('recipient', ['username', 'accountType']);
    
    res.json(connections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;