// backend/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Record = require('../models/Record');
const path = require('path');

// GET /api/users/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/users/update  (multipart/form-data accepted)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email required' });

    // email uniqueness check
    const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    // update fields
    req.user.name = name;
    req.user.email = email;

    // profile picture if uploaded via multer under 'profile'
    if (req.file && req.file.fieldname === 'profile') {
      // store path relative to server root for frontend
      req.user.profilePicture = `/uploads/profilePictures/${req.file.filename}`;
    }

    await req.user.save();
    res.json({ user: { _id: req.user._id, name: req.user.name, email: req.user.email, profilePicture: req.user.profilePicture } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/change-password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new password required' });

    const matched = await bcrypt.compare(oldPassword, req.user.password);
    if (!matched) return res.status(401).json({ message: 'Old password incorrect' });

    req.user.password = newPassword; // pre-save hashes it
    await req.user.save();
    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/delete
exports.deleteAccount = async (req, res) => {
  try {
    await Record.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account and records deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
