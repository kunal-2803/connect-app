const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const Meeting = require('../models/Meeting');
const Connection = require('../models/Connection');

// @route   POST api/meetings/:connection_id
// @desc    Create a meeting proposal
// @access  Private
router.post('/:connection_id', [
  auth,
  [
    check('dateTime', 'Date and time are required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const connection = await Connection.findById(req.params.connection_id);
    
    if (!connection) {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    
    // Verify user is part of the connection
    if (connection.recipient.toString() !== req.user.id && connection.requester.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Verify connection is active
    if (connection.status !== 'accepted') {
      return res.status(400).json({ msg: 'Cannot propose meeting: connection is not active' });
    }
    
    const { dateTime, location, details } = req.body;
    
    const meeting = new Meeting({
      connection: req.params.connection_id,
      proposedBy: req.user.id,
      dateTime,
      location,
      details,
      acceptedBy: []
    });
    
    await meeting.save();
    
    res.json(meeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/meetings/:meeting_id/accept
// @desc    Accept a meeting proposal
// @access  Private
router.put('/:meeting_id/accept', auth, async (req, res) => {
  try {
    let meeting = await Meeting.findById(req.params.meeting_id)
      .populate('connection');
    
    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }
    
    // Verify user is part of the connection
    const connection = meeting.connection;
    if (connection.recipient.toString() !== req.user.id && connection.requester.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Verify user is not the proposer
    if (meeting.proposedBy.toString() === req.user.id) {
      return res.status(400).json({ msg: 'You cannot accept your own meeting proposal' });
    }
    
    // Check if user already accepted
    const alreadyAccepted = meeting.acceptedBy.some(
      acceptance => acceptance.user.toString() === req.user.id
    );
    
    if (alreadyAccepted) {
      return res.status(400).json({ msg: 'You have already accepted this meeting' });
    }
    
    // Add user to acceptedBy array
    meeting = await Meeting.findByIdAndUpdate(
      req.params.meeting_id,
      { 
        $push: { acceptedBy: { user: req.user.id, acceptedAt: Date.now() } },
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    // Check if all parties have accepted
    const allPartiesAccepted = await checkAllPartiesAccepted(meeting._id);
    
    if (allPartiesAccepted) {
      meeting = await Meeting.findByIdAndUpdate(
        req.params.meeting_id,
        { $set: { status: 'accepted', updatedAt: Date.now() } },
        { new: true }
      );
    }
    
    res.json(meeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Helper function to check if all parties have accepted the meeting
async function checkAllPartiesAccepted(meetingId) {
  const meeting = await Meeting.findById(meetingId).populate('connection');
  const connection = meeting.connection;
  
  // Get all user IDs involved in the connection
  const userIds = [connection.requester.toString(), connection.recipient.toString()];
  
  // Check if proposer has automatically accepted
  const proposerId = meeting.proposedBy.toString();
  const acceptedUserIds = meeting.acceptedBy.map(acceptance => acceptance.user.toString());
  
  // Add proposer as accepted if not already in the array
  if (!acceptedUserIds.includes(proposerId)) {
    acceptedUserIds.push(proposerId);
  }
  
  // Check if all users have accepted
  return userIds.every(userId => acceptedUserIds.includes(userId));
}

// @route   PUT api/meetings/:meeting_id/cancel
// @desc    Cancel a meeting
// @access  Private
router.put('/:meeting_id/cancel', auth, async (req, res) => {
  try {
    let meeting = await Meeting.findById(req.params.meeting_id)
      .populate('connection');
    
    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }
    
    // Verify user is part of the connection
    const connection = meeting.connection;
    if (connection.recipient.toString() !== req.user.id && connection.requester.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update meeting status
    meeting = await Meeting.findByIdAndUpdate(
      req.params.meeting_id,
      { $set: { status: 'canceled', updatedAt: Date.now() } },
      { new: true }
    );
    
    res.json(meeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/meetings/:meeting_id/complete
// @desc    Mark a meeting as completed
// @access  Private
router.put('/:meeting_id/complete', auth, async (req, res) => {
  try {
    let meeting = await Meeting.findById(req.params.meeting_id)
      .populate('connection');
    
    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }
    
    // Verify user is part of the connection
    const connection = meeting.connection;
    if (connection.recipient.toString() !== req.user.id && connection.requester.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update meeting status
    meeting = await Meeting.findByIdAndUpdate(
      req.params.meeting_id,
      { $set: { status: 'completed', updatedAt: Date.now() } },
      { new: true }
    );
    
    res.json(meeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/meetings/connection/:connection_id
// @desc    Get all meetings for a connection
// @access  Private
router.get('/connection/:connection_id', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connection_id);
    
    if (!connection) {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    
    // Verify user is part of the connection
    if (connection.recipient.toString() !== req.user.id && connection.requester.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    const meetings = await Meeting.find({ connection: req.params.connection_id })
      .sort({ dateTime: 1 });
    
    res.json(meetings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/meetings/user
// @desc    Get all meetings for a user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    // Find all connections the user is part of
    const connections = await Connection.find({
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id }
      ],
      status: 'accepted'
    });
    
    const connectionIds = connections.map(conn => conn._id);
    
    // Find all meetings for these connections
    const meetings = await Meeting.find({
      connection: { $in: connectionIds }
    })
    .populate('connection')
    .populate('proposedBy', 'username')
    .sort({ dateTime: 1 });
    
    res.json(meetings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;