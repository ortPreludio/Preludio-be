// Rutas para Pagos
import { Router } from 'express';
import { checkout, getPagoById, listMisPagos, listPagos } from '../controllers/pagosController.js';
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { ensureValidObjectId } from "../middlewares/validations.js";

const router = Router();
const ensureValidPagoId = ensureValidObjectId("id", "Pago");

// Crear pago (checkout)
router.post('/checkout', requireAuth, checkout);
// Listar pagos con paginación
router.get('/', requireAuth, listMisPagos);
// Lista paginada de TODOS los pagos (solo ADMIN)
router.get("/list", requireAuth, requireRole("ADMIN"), listPagos);
// Obtener pago por ID
router.get('/:id', requireAuth, ensureValidPagoId, getPagoById);

export default router;
