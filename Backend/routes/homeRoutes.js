const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const authenticateToken = require('../middleware/auth');

// Apply auth middleware to all home routes
router.use(authenticateToken);

// Full Home Page Data
router.get('/', homeController.getHomeData);

// Tasks
router.get('/tasks', homeController.getTasks);
router.get('/tasks/:id', homeController.getTaskById);
router.post('/tasks/:id/start', homeController.startTask);
router.post('/tasks/:id/complete', homeController.completeTask);
router.patch('/tasks/:id/progress', homeController.updateTaskProgress);

// Points
router.get('/points', homeController.getPoints);
router.get('/points/history', homeController.getPointsHistory);

module.exports = router;
