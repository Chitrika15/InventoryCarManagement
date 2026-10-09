export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  category: Category | string;
  brand: string;
  price: number; // in paise
  costPrice: number; // in paise
  stock: number;
  reorderLevel: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  product: Product | string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  at: string;
  by?: { name: string; role: string } | string | null;
  note?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: { _id: string; name: string; email: string };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    brand: string;
    price: number;
    stock: number;
    reorderLevel: number;
    imageUrl: string;
  };
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  } | null;
  meta?: PaginationMeta;
}

export interface DashboardKPIs {
  totalRevenue: number;
  totalOrders: number;
  unitsSold: number;
  lowStockCount: number;
  totalProducts: number;
  totalInventoryValue: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  ordersCount: number;
}

export interface TopSellerItem {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
}

export interface CategoryStockValue {
  categoryId: string;
  categoryName: string;
  slug: string;
  productCount: number;
  totalStockUnits: number;
  totalStockValue: number;
  totalCostValue: number;
}
