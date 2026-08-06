// ─── Core Data Types for TA3N Store ───

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  version?: string;
  status: 'active' | 'hidden';
  keys_remaining?: number;
  keys_total?: number;
  activated_count?: number;
  stock_count?: number;
  total_downloads?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProductFile {
  id: string;
  product_id: string;
  filename: string;
  original_name: string;
  size: number;
  mime_type?: string;
  download_count: number;
  created_at: string;
}

export interface ProductKey {
  id: string;
  product_id: string;
  product_name?: string;
  key_value: string;
  status: 'unused' | 'redeemed' | 'expired' | 'disabled';
  duration?: 'lifetime' | '30d' | '7d' | '1d';
  expires_at?: string;
  used_by?: string;
  used_by_name?: string;
  used_by_email?: string;
  used_at?: string;
  used_ip?: string;
  created_at: string;
}

export interface User {
  id: string;
  google_id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'owner';
  is_banned: number;
  ban_reason?: string;
  ip?: string;
  user_agent?: string;
  created_at?: string;
  last_login?: string;
  activated_count?: number;
  keys_count?: number;
}

export interface ActivatedProduct extends Product {
  activated_at: string;
  key_value?: string;
  files: ProductFile[];
}

export interface UserProduct {
  id: string;
  user_id: string;
  product_id: string;
  key_id?: string;
  activated_at: string;
}

export interface LogEntry {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  details: string;
  ip?: string;
  user_agent?: string;
  created_at: string;
}

export interface SystemStats {
  totalUsers: number;
  totalProducts: number;
  totalKeys: number;
  usedKeys: number;
  unusedKeys: number;
  totalDownloads: number;
  totalLogs: number;
  recentActivations: Array<{
    id: string;
    product_name: string;
    user_name: string;
    user_email: string;
    activated_at: string;
  }>;
  recentUsers: User[];
}

export interface RedeemedKeyRecord {
  id: string;
  key_value: string;
  product_id: string;
  product_name: string;
  user_id: string;
  username: string;
  user_email: string;
  ip: string;
  user_agent: string;
  redeem_date: string;
  expiration_date?: string;
  license_type: 'lifetime' | '30d' | '7d' | '1d';
  download_count: number;
  last_download?: string;
  status: 'active' | 'expired' | 'disabled';
}

export interface DetailedUserView extends User {
  owned_products: Array<{
    id: string;
    name: string;
    image: string;
    activated_at: string;
    key_value: string;
    download_count: number;
    last_download?: string;
  }>;
  activated_keys: ProductKey[];
  download_history: Array<{
    file_name: string;
    product_name: string;
    downloaded_at: string;
    ip: string;
    user_agent: string;
  }>;
  activity_logs: LogEntry[];
}

// Route/Page types
export type UserPage = 'overview' | 'products' | 'redeem' | 'profile' | 'settings' | 'docs';
export type AdminPage = 'dashboard' | 'admin-products' | 'admin-keys' | 'admin-redeemed-keys' | 'admin-users' | 'admin-analytics' | 'admin-logs' | 'admin-settings' | 'admin-tickets';
export type AppPage = UserPage | AdminPage;
