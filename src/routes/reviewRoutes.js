import { Router } from 'express';
import {listReviews, createReview, getReviews, getReviewById, getMyReview, updateMyReview, updateReview, deleteMyReview, deleteReview,} from '../controllers/reviewController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

// Rutas públicas
router.get('/', getReviews); // Obtener todas las reseñas
router.get('/list', listReviews); // Listar con paginación
router.get('/:id', getReviewById); // Obtener reseña por ID

// Rutas protegidas - Usuario autenticado
router.get('/me/review', requireAuth, getMyReview); // Obtener mi reseña
router.post('/', requireAuth, createReview); // Crear mi reseña
router.put('/me', requireAuth, updateMyReview); // Actualizar mi reseña
router.delete('/me', requireAuth, deleteMyReview); // Eliminar mi reseña

// Rutas protegidas - Solo Admin
router.put('/:id', requireAuth, requireRole('ADMIN'), updateReview); // Admin actualiza cualquier reseña
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteReview); // Admin elimina cualquier reseña

export default router;