import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
} from '../validators/product.validator.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { uploadProductImage } from '../utils/uploader.js';

const router = Router();

// Public routes
router.get('/categories', ProductController.listCategories);
router.get('/brands', ProductController.listBrands);
router.get('/', validateRequest({ query: productQuerySchema }), ProductController.list);
router.get('/:id', validateRequest({ params: productIdParamSchema }), ProductController.getById);

// Admin routes
router.post(
  '/upload',
  requireAuth,
  requireRole('admin'),
  uploadProductImage.single('image'),
  ProductController.uploadImage
);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateRequest({ body: createProductSchema }),
  ProductController.create
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateRequest({ params: productIdParamSchema, body: updateProductSchema }),
  ProductController.update
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateRequest({ params: productIdParamSchema }),
  ProductController.delete
);

export const productRouter = router;
