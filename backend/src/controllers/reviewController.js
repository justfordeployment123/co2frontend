// backend/src/controllers/reviewController.js
import pool from '../utils/db.js';
import { requireRole } from '../middleware/auth.js';


// List all reviews
export async function getReviews(req, res) {
	try {
		const result = await pool.query(
			`SELECT r.*, u.first_name, u.last_name, u.email as reviewer_email
			 FROM reviews r
			 JOIN users u ON r.reviewer_id = u.id
			 ORDER BY r.created_at DESC`
		);
		res.json(result.rows);
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
}

// Add a new review
export async function addReview(req, res) {
	try {
		const { report_id, status, comment } = req.body;
		const reviewer_id = req.user.userId;
		const result = await pool.query(
			`INSERT INTO reviews (report_id, reviewer_id, review_status, comment)
			 VALUES ($1, $2, $3, $4) RETURNING *`,
			[report_id, reviewer_id, status || 'pending', comment]
		);
		res.json(result.rows[0]);
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
}

// Update a review
export async function updateReview(req, res) {
	try {
		const { id } = req.params;
		const { status, comment } = req.body;
		// Only admin or original reviewer can update
		const review = await pool.query(`SELECT * FROM reviews WHERE id = $1`, [id]);
		if (!review.rows.length) return res.status(404).json({ success: false, error: 'Review not found' });
		if (req.user.role !== 'internal_admin' && req.user.userId !== review.rows[0].reviewer_id) {
			return res.status(403).json({ success: false, error: 'Insufficient permissions' });
		}
		const result = await pool.query(
			`UPDATE reviews SET review_status = $1, comment = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
			[status || review.rows[0].review_status, comment || review.rows[0].comment, id]
		);
		res.json(result.rows[0]);
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
}

// Delete a review
export async function deleteReview(req, res) {
	try {
		const { id } = req.params;
		// Only admin can delete
		if (req.user.role !== 'internal_admin') {
			return res.status(403).json({ success: false, error: 'Insufficient permissions' });
		}
		await pool.query(`DELETE FROM reviews WHERE id = $1`, [id]);
		res.json({ success: true });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
}

export default { getReviews, addReview, updateReview, deleteReview };





































































