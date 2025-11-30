import { Router } from 'express';
import { listReviews, createReview, getReviews, getReviewById, getMyReview, updateMyReview, updateReview, deleteMyReview, deleteReview, } from '../controllers/reviewController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { ensureValidObjectId, validateRequest, createReviewSchema, updateReviewSchema } from "../middlewares/validations.js";

const router = Router();
const ensureValidReviewId = ensureValidObjectId("id", "Reseña");

// Rutas públicas
router.get('/', getReviews); // Obtener todas las reseñas
router.get('/list', listReviews); // Listar con paginación
router.get('/:id', ensureValidReviewId, getReviewById); // Obtener reseña por ID

// Rutas protegidas - Usuario autenticado
router.get('/me/review', requireAuth, getMyReview); // Obtener mi reseña
router.post('/', requireAuth, validateRequest(createReviewSchema), createReview); // Crear mi reseña
router.put('/me', requireAuth, validateRequest(updateReviewSchema), updateMyReview); // Actualizar mi reseña
router.delete('/me', requireAuth, deleteMyReview); // Eliminar mi reseña

// Rutas protegidas - Solo Admin
router.put('/:id', requireAuth, requireRole('ADMIN'), ensureValidReviewId, validateRequest(updateReviewSchema), updateReview); // Admin actualiza cualquier reseña
router.delete('/:id', requireAuth, requireRole('ADMIN'), ensureValidReviewId, deleteReview); // Admin elimina cualquier reseña

export default router;