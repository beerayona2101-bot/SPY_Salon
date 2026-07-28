/**
 * Profile Management REST API Routes
 */
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Avatar Upload & Delete
router.post('/avatar', profileController.uploadAvatar);
router.delete('/avatar', profileController.removeAvatar);

// Profile Details Update & Password Change
router.put('/details', profileController.updateProfile);
router.put('/change-password', profileController.changePassword);

// Service Packages Management
router.get('/packages', profileController.getUserPackages);
router.post('/packages/book', profileController.bookPackageSession);

// Account Deletion
router.delete('/account', profileController.deleteAccount);

module.exports = router;
