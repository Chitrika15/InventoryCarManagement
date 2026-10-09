import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Eye,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Product, Category } from '../../types/index.js';
import { formatCurrency, getStockStatus } from '../../lib/utils.js';
import { useCartStore } from '../../store/useCartStore.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { Modal } from '../../components/ui/Modal.js';
import { useToast } from '../../components/ui/Toast.js';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCartStore();
  const { success, error: showError } = useToast();

  // Read URL searchParams as the single source of truth
  const searchParam = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const selectedStockStatus = searchParams.get('stockStatus') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Local state for instant typing in search input
  const [searchTerm, setSearchTerm] = useState(searchParam);

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync search input when URL changes externally
  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  // Debounced search effect: writes to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== searchParam) {
        updateFilter({ search: searchTerm || null, page: null });
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm, searchParam]);

  const updateFilter = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (!val) {
        newParams.delete(key);
      } else {
        newParams.set(key, val);
      }
    });
    // If changing any filter other than page, reset page to 1
    if (!('page' in updates)) {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  // Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return res.data.data;
    },
  });

  // Fetch Brands
  const { data: brands = [] } = useQuery<string[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get('/products/brands');
      return res.data.data;
    },
  });

  // Fetch Products Query using current URL parameters
  const { data, isLoading, isError } = useQuery<{ products: Product[]; meta: any }>({
    queryKey: ['products', searchParam, selectedCategory, selectedBrand, selectedStockStatus, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParam) params.append('search', searchParam);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (selectedStockStatus) params.append('stockStatus', selectedStockStatus);
      params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', '12');

      const res = await api.get(`/products?${params.toString()}`);
      return {
        products: res.data.data,
        meta: res.data.meta,
      };
    },
  });

  const products = data?.products || [];
  const meta = data?.meta;

  const handleAddToCart = (product: Product) => {
    const res = addItem(product, 1);
    if (res.success) {
      success(`Added "${product.name}" to cart!`);
    } else {
      showError(res.message || 'Cannot add item to cart');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="space-y-8">
      {/* Hero Showcase Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-navy-900 via-navy-800 to-navy-950 text-white p-8 sm:p-12 border border-navy-700/60 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/20 text-accent-400 text-xs font-bold border border-accent-500/30">
            <Sparkles className="w-3.5 h-3.5" /> High Performance Automotive Gear
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Elevate Your Drive with <span className="text-accent-500">StockDrive</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            Explore genuine high-grade tyres, lithium jump starters, Sony/Pioneer infotainment,
            ultra-bright LED projectors, and bespoke interior styling.
          </p>
        </div>
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="w-full md:w-96">
            <Input
              type="text"
              placeholder="Search by name, SKU, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Sort & Quick Stock Status */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={selectedStockStatus}
              onChange={(e) => updateFilter({ stockStatus: e.target.value || null })}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
            >
              <option value="">All Stock Levels</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock (≤ 5 units)</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => updateFilter({ brand: e.target.value || null })}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => updateFilter({ sort: e.target.value !== 'newest' ? e.target.value : null })}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
            >
              <option value="newest">Sort: Newest Arrival</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="stock_desc">Highest Stock</option>
            </select>

            {(searchParam || selectedCategory || selectedBrand || selectedStockStatus || sortBy !== 'newest') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none">
          <button
            onClick={() => updateFilter({ category: null })}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === ''
                ? 'bg-accent-500 text-white shadow-md shadow-accent-500/20'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => updateFilter({ category: c.slug })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.slug
                  ? 'bg-accent-500 text-white shadow-md shadow-accent-500/20'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-navy-800 p-4 space-y-4"
            >
              <Skeleton className="w-full h-48 rounded-xl" />
              <Skeleton className="w-3/4 h-5" />
              <Skeleton className="w-1/2 h-4" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="w-24 h-6" />
                <Skeleton className="w-20 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800">
          <p className="text-rose-500 font-bold mb-2">Error loading accessory products</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-800 mx-auto flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            No accessories found
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords, clearing selected category filters, or selecting a
            different stock filter.
          </p>
          <Button variant="primary" size="sm" onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const stockStatus = getStockStatus(product.stock, product.reorderLevel);

            return (
              <Card
                key={product._id}
                className="group overflow-hidden flex flex-col justify-between hover:shadow-xl dark:hover:shadow-navy-glow/20 transition-all duration-300 border-slate-200/80 dark:border-navy-800"
              >
                <div>
                  {/* Product Image & Badges */}
                  <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                    <img
                      src={
                        product.imageUrl ||
                        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Stock status badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${stockStatus.badgeClass}`}
                      >
                        {stockStatus.label}
                      </span>
                    </div>

                    {/* Quick view button */}
                    <button
                      onClick={() => setQuickViewProduct(product)}
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/90 dark:bg-navy-900/90 text-slate-700 dark:text-slate-200 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer"
                      title="Quick View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Body */}
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <span>{product.brand}</span>
                      <span className="font-mono text-slate-400">{product.sku}</span>
                    </div>

                    <h3
                      className="font-bold text-slate-900 dark:text-white line-clamp-2 text-sm leading-snug group-hover:text-accent-500 transition-colors cursor-pointer"
                      onClick={() => setQuickViewProduct(product)}
                    >
                      {product.name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Price and Add to Cart */}
                <div className="p-5 pt-0 border-t border-slate-100 dark:border-navy-800/80 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Price</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={product.stock > 0 ? 'primary' : 'outline'}
                    disabled={product.stock <= 0}
                    onClick={() => handleAddToCart(product)}
                    className="gap-1.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.stock > 0 ? 'Add' : 'Sold Out'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-navy-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(page - 1) * meta.limit + 1}</span> to{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(page * meta.limit, meta.total)}
            </span>{' '}
            of <span className="font-bold text-slate-800 dark:text-slate-200">{meta.total}</span> products
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrev}
              onClick={() => updateFilter({ page: Math.max(1, page - 1).toString() })}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-xs font-semibold px-2 text-slate-600 dark:text-slate-400">
              Page {page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => updateFilter({ page: (page + 1).toString() })}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <Modal
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          title={quickViewProduct.name}
          description={`SKU: ${quickViewProduct.sku} • Brand: ${quickViewProduct.brand}`}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="rounded-2xl overflow-hidden aspect-square bg-slate-100 dark:bg-navy-950">
              <img
                src={quickViewProduct.imageUrl}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      getStockStatus(quickViewProduct.stock, quickViewProduct.reorderLevel).badgeClass
                    }`}
                  >
                    {getStockStatus(quickViewProduct.stock, quickViewProduct.reorderLevel).label}
                  </span>
                </div>

                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(quickViewProduct.price)}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {quickViewProduct.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
                <Button
                  className="w-full"
                  disabled={quickViewProduct.stock <= 0}
                  onClick={() => {
                    handleAddToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {quickViewProduct.stock > 0 ? 'Add to Cart' : 'Currently Unavailable'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
