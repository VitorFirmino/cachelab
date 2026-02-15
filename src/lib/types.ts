export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  categoryId: number | null;
  category: Category | null;
  updatedAt: string;
  createdAt: string;
}

export interface Event {
  id: number;
  type: string;
  message: string;
  productId: number | null;
  product?: Product | null;
  createdAt: string;
}

export interface ProductsPageData {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductDetailData {
  product: Product;
  events: Event[];
}

export interface FeaturedData {
  products: Product[];
}

