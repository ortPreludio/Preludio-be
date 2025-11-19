// Rutas para Pagos
import { Router } from 'express';
import { checkout, getPagoById } from '../controllers/pagosController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Crear pago (checkout)
router.post('/checkout', requireAuth, checkout);
// Obtener pago por ID
router.get('/:id', requireAuth, getPagoById);

export default router;
