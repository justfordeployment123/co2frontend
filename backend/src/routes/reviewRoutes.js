// backend/src/routes/reviewRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import reviewController from '../controllers/reviewController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// List all reviews
router.get('/', reviewController.getReviews);
// Add a new review
router.post('/', reviewController.addReview);
// Update a review
router.put('/:id', reviewController.updateReview);
// Delete a review
router.delete('/:id', reviewController.deleteReview);

export default router;
