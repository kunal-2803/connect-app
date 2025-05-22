const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Message = require('../models/Message');
const Connection = require('../models/Connection');

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   POST api/messages/:connection_id
// @desc    Send a message in a connection
// @access  Private
router.post('/:connection_id', [
  auth,
  [
    check('content', 'Message content is required').not().isEmpty(),
    check('messageType', 'Message type is required').not().isEmpty()
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
      return res.status(400).json({ msg: 'Cannot send message: connection is not active' });
    }
    
    const { content, messageType } = req.body;
    
    const message = new Message({
      connection: req.params.connection_id,
      sender: req.user.id,
      content,
      messageType
    });
    
    await message.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username');
    
    res.json(populatedMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/messages/:connection_id/image
// @desc    Send an image message
// @access  Private
router.post('/:connection_id/image', [auth, upload.single('image')], async (req, res) => {
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
      return res.status(400).json({ msg: 'Cannot send message: connection is not active' });
    }
    
    if (!req.file) {
      return res.status(400).json({ msg: 'No image uploaded' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'message_images',
      resource_type: 'image'
    });
    
    const message = new Message({
      connection: req.params.connection_id,
      sender: req.user.id,
      content: result.secure_url,
      messageType: 'image'
    });
    
    await message.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username');
    
    res.json(populatedMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/messages/:connection_id
// @desc    Get messages for a connection
// @access  Private
router.get('/:connection_id', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connection_id);
    
    if (!connection) {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    
    // Verify user is part of the connection
    if (connection.recipient.toString() !== req.user.id && connection.requester.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    const messages = await Message.find({ connection: req.params.connection_id })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/messages/read/:connection_id
// @desc    Mark all messages as read for a connection
// @access  Private
router.put('/read/:connection_id', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connection_id);
    
    if (!connection) {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    
    // Verify user is part of the connection
    if (connection.recipient.toString() !== req.user.id && connection.requester.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Mark all messages from the other user as read
    await Message.updateMany(
      { 
        connection: req.params.connection_id,
        sender: { $ne: req.user.id },
        isRead: false
      },
      { $set: { isRead: true } }
    );
    
    res.json({ msg: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;