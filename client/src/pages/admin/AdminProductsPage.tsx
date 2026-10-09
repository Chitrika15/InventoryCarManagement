import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  Boxes,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Product, Category } from '../../types/index.js';
import { formatCurrency, getStockStatus } from '../../lib/utils.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../components/ui/Toast.js';

const productFormSchema = z.object({
  sku: z.string().min(2, 'SKU is required').max(50).toUpperCase(),
  name: z.string().min(2, 'Name is required').max(200),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  priceINR: z.coerce.number().min(0, 'Price must be non-negative'),
  costPriceINR: z.coerce.number().min(0, 'Cost price must be non-negative'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  reorderLevel: z.coerce.number().int().min(0).default(5),
  description: z.string().default(''),
  imageUrl: z.string().optional().default(''),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export const AdminProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductCandidate, setDeleteProductCandidate] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return res.data.data;
    },
  });

  // Fetch Products
  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['admin-products', searchTerm, categoryFilter, includeInactive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (includeInactive) params.append('includeInactive', 'true');
      params.append('limit', '50');

      const res = await api.get(`/products?${params.toString()}`);
      return { products: res.data.data };
    },
  });

  const products = productsData?.products || [];

  // Form for Add / Edit
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: '',
      name: '',
      category: '',
      brand: '',
      priceINR: 0,
      costPriceINR: 0,
      stock: 10,
      reorderLevel: 5,
      description: '',
      imageUrl: '',
      isActive: true,
    },
  });

  const openAddModal = () => {
    reset({
      sku: '',
      name: '',
      category: categories[0]?._id || '',
      brand: '',
      priceINR: 0,
      costPriceINR: 0,
      stock: 10,
      reorderLevel: 5,
      description: '',
      imageUrl: '',
      isActive: true,
    });
    setImageFile(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    const catId = typeof p.category === 'object' ? (p.category as Category)._id : p.category;
    setEditingProduct(p);
    reset({
      sku: p.sku,
      name: p.name,
      category: catId,
      brand: p.brand,
      priceINR: p.price / 100,
      costPriceINR: p.costPrice / 100,
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      description: p.description,
      imageUrl: p.imageUrl,
      isActive: p.isActive,
    });
    setImageFile(null);
  };

  // Image Upload Handler
  const handleUploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/products/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.imageUrl;
  };

  // Save (Create or Update)
  const onSaveProduct = async (formData: ProductFormData) => {
    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        setIsUploadingImage(true);
        finalImageUrl = await handleUploadFile(imageFile);
      }

      const payload = {
        sku: formData.sku.toUpperCase(),
        name: formData.name,
        category: formData.category,
        brand: formData.brand,
        price: Math.round(formData.priceINR * 100), // convert to paise
        costPrice: Math.round(formData.costPriceINR * 100), // convert to paise
        stock: formData.stock,
        reorderLevel: formData.reorderLevel,
        description: formData.description,
        imageUrl: finalImageUrl,
        isActive: formData.isActive,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        success(`Product ${payload.sku} updated successfully!`);
        setEditingProduct(null);
      } else {
        await api.post('/products', payload);
        success(`Product ${payload.sku} created successfully!`);
        setIsAddModalOpen(false);
      }

      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-kpis'] });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to save product.';
      showError(msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Soft Delete / Toggle Active
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.put(`/products/${id}`, { isActive });
      return res.data.data;
    },
    onSuccess: (updated) => {
      success(
        `Product ${updated.sku} is now ${updated.isActive ? 'Active' : 'Inactive (Soft Deleted)'}.`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteProductCandidate(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update product status');
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Products Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage auto accessories SKUs, pricing, warehouse stock levels, and media
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" className="gap-2">
          <Plus className="w-4 h-4" /> Add New Accessory
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-slate-200 dark:border-navy-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search SKU, name, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded text-accent-500 focus:ring-accent-500"
            />
            Show Inactive / Soft Deleted
          </label>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-850">
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Product</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">SKU</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Category</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Price</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Cost Price</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Stock</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="p-4">
                      <Skeleton className="w-full h-8 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No matching accessories found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stockStatus = getStockStatus(p.stock, p.reorderLevel);
                  const catName =
                    typeof p.category === 'object' && p.category
                      ? (p.category as Category).name
                      : 'N/A';

                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-navy-800/40 transition-colors ${
                        !p.isActive ? 'opacity-60 bg-slate-50/40 dark:bg-navy-950/40' : ''
                      }`}
                    >
                      {/* Product Name & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl || 'https://placehold.co/100x100?text=Auto'}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shrink-0"
                          />
                          <div className="truncate max-w-xs">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400">{p.brand}</span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {p.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {catName}
                      </td>

                      {/* Retail Price */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(p.price)}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                        {formatCurrency(p.costPrice)}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${stockStatus.badgeClass}`}
                        >
                          {p.stock} units
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        {p.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="danger">Inactive</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-accent-500 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              toggleActiveMutation.mutate({ id: p._id, isActive: !p.isActive })
                            }
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              p.isActive
                                ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title={p.isActive ? 'Deactivate (Soft Delete)' : 'Restore to Active'}
                          >
                            {p.isActive ? (
                              <Trash2 className="w-4 h-4" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingProduct}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? `Edit ${editingProduct.sku}` : 'Add New Automotive Accessory'}
        description="Configure product details, wholesale costs, reorder limits, and photo"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit(onSaveProduct)} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                SKU (Unique)
              </label>
              <Input
                placeholder="e.g. TYR-MIC-001"
                error={errors.sku?.message}
                {...register('sku')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Brand Name
              </label>
              <Input
                placeholder="e.g. Michelin, Sony, Exide"
                error={errors.brand?.message}
                {...register('brand')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Product Title / Name
              </label>
              <Input
                placeholder="e.g. Michelin Primacy 4 ST 205/55 R16 Tubeless Tyre"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Category
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
                {...register('category')}
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Retail Selling Price (₹ INR)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="4500"
                error={errors.priceINR?.message}
                {...register('priceINR')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Cost / Procurement Price (₹ INR)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="3200"
                error={errors.costPriceINR?.message}
                {...register('costPriceINR')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Current Warehouse Stock
              </label>
              <Input
                type="number"
                placeholder="20"
                error={errors.stock?.message}
                {...register('stock')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Low-Stock Reorder Alert Level
              </label>
              <Input
                type="number"
                placeholder="5"
                error={errors.reorderLevel?.message}
                {...register('reorderLevel')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Product Image (Upload Local File or Enter Image URL)
              </label>
              <div className="flex gap-2 items-center">
                <Input placeholder="https://..." {...register('imageUrl')} />
                <label className="shrink-0 px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-700 cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-navy-700">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setImageFile(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
              {imageFile && (
                <p className="text-[11px] text-emerald-500 font-semibold mt-1">
                  Ready to upload: {imageFile.name}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Description & Specifications
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="Technical details, vehicle compatibility, warranty..."
                {...register('description')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-accent-500 focus:ring-accent-500"
                  {...register('isActive')}
                />
                Active in Storefront (Uncheck to soft-delete / hide from customers)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              disabled={isSubmitting || isUploadingImage}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || isUploadingImage}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
