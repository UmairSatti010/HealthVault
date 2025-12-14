// backend/routes/users.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../multer'); // multer instance
const { getMe, updateProfile, changePassword, deleteAccount } = require('../controllers/userController');

router.get('/me', protect, getMe);

// multipart/form-data for profile picture
router.put('/update', protect, upload.single('profile'), updateProfile);

router.put('/change-password', protect, changePassword);
router.delete('/delete', protect, deleteAccount);

module.exports = router;
