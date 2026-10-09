import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { BadRequestError } from '../utils/errors.js';
import { ProductQueryInput } from '../validators/product.validator.js';

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.listProducts(req.query as unknown as ProductQueryInput);
      sendSuccess(res, result.products, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getProductById(req.params.id);
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.userId;
      const product = await ProductService.createProduct(req.body, actorId);
      sendSuccess(res, product, 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.userId;
      const product = await ProductService.updateProduct(req.params.id, req.body, actorId);
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.userId;
      const product = await ProductService.softDeleteProduct(req.params.id, actorId);
      sendSuccess(res, { message: 'Product successfully deactivated', product });
    } catch (err) {
      next(err);
    }
  }

  static async listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await ProductService.listCategories();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  static async listBrands(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await ProductService.listBrands();
      sendSuccess(res, brands);
    } catch (err) {
      next(err);
    }
  }

  static async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file uploaded');
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      sendSuccess(res, { imageUrl });
    } catch (err) {
      next(err);
    }
  }
}
