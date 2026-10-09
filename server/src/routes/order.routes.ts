import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  createOrderSchema,
  orderQuerySchema,
  updateOrderStatusSchema,
  orderIdParamSchema,
} from '../validators/order.validator.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateRequest({ body: createOrderSchema }), OrderController.create);
router.get('/', validateRequest({ query: orderQuerySchema }), OrderController.list);
router.get('/:id', validateRequest({ params: orderIdParamSchema }), OrderController.getById);
router.patch(
  '/:id/status',
  requireRole('admin'),
  validateRequest({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  OrderController.updateStatus
);
router.post('/:id/cancel', validateRequest({ params: orderIdParamSchema }), OrderController.cancelMyOrder);

export const orderRouter = router;
