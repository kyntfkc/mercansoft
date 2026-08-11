// API Client for Railway Backend

import { useAuthStore } from '../store/useAuthStore';
import { defaultReceiptSettings, mergeReceiptSettings, ReceiptSettings } from './receipt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-678d.up.railway.app';

// Debug: API URL'ini logla (sadece browser'da)
if (typeof window !== 'undefined') {
  console.log('🔗 API URL:', API_URL);
  console.log('🔗 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'AYARLANMAMIŞ');
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export interface Stone {
  id: string;
  name: string;
  countPerGram: number;
}

export interface Model {
  id: string;
  name: string;
  stockCode?: string;
  category?: string;
  image?: string;
  stones: Array<{ stoneId: string; quantity: number }>;
}

export interface StoneSet {
  id: string;
  name: string;
  stones: Array<{ stoneId: string; quantity: number }>;
}

// API Helper Functions
const getAuthHeaders = (skipAuth?: boolean) => {
  if (skipAuth || typeof window === 'undefined') {
    return {};
  }

  try {
    const token = useAuthStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.error('Auth header hazırlanırken hata:', error);
    return {};
  }
};

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, headers, ...restOptions } = options;
  const authHeaders = getAuthHeaders(skipAuth);
  const url = `${API_URL}${endpoint}`;
  
  console.log(`🌐 API İsteği: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
    });

    console.log(`📡 API Yanıtı: ${response.status} ${response.statusText} - ${url}`);

    if (!response.ok) {
      // 401 Unauthorized hatası - Token geçersiz veya süresi dolmuş
      if (response.status === 401 && !skipAuth) {
        console.warn('⚠️ 401 Unauthorized - Token geçersiz, logout yapılıyor...');
        // Auth store'dan logout yap
        if (typeof window !== 'undefined') {
          const { useAuthStore } = await import('../store/useAuthStore');
          useAuthStore.getState().logout();
          // Login sayfasına yönlendir
          window.location.href = '/login';
        }
      }
      
      const bodyText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(bodyText);
        errorMessage = errorData.error || errorMessage;
        console.error(`❌ API Hatası:`, errorData);
      } catch {
        const htmlMatch = bodyText.match(/<pre>([^<]+)<\/pre>/i);
        errorMessage = htmlMatch?.[1]?.trim() || bodyText || errorMessage;
        console.error(`❌ API Hatası (text):`, errorMessage);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    // Network hatası veya diğer hatalar
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`❌ Network Hatası: Backend'e bağlanılamıyor - ${url}`);
      throw new Error(`Backend'e bağlanılamıyor. Lütfen API URL'ini kontrol edin: ${API_URL}`);
    }
    throw error;
  }
}

// Backend'den gelen snake_case'i camelCase'e çevir
function transformStone(stone: any): Stone {
  // count_per_gram string veya number olabilir
  let countPerGram = 0;
  
  if (stone.count_per_gram !== undefined && stone.count_per_gram !== null) {
    const parsed = parseFloat(String(stone.count_per_gram));
    countPerGram = isNaN(parsed) ? 0 : parsed;
  } else if (stone.countPerGram !== undefined && stone.countPerGram !== null) {
    const parsed = parseFloat(String(stone.countPerGram));
    countPerGram = isNaN(parsed) ? 0 : parsed;
  }
  
  return {
    id: stone.id,
    name: stone.name,
    countPerGram: countPerGram,
  };
}

function transformModel(model: any): Model {
  return {
    id: model.id,
    name: model.name,
    stockCode: model.stock_code || model.stockCode,
    category: model.category,
    metalType: model.metal_type || model.metalType || undefined,
    image: model.image,
    stones: model.stones || [],
  };
}

function transformStoneSet(stoneSet: any): StoneSet {
  return {
    id: stoneSet.id,
    name: stoneSet.name,
    stones: stoneSet.stones || [],
  };
}

// Stones API
export const stonesAPI = {
  getAll: async (): Promise<Stone[]> => {
    const data = await fetchAPI<any[]>('/api/stones');
    return data.map(transformStone);
  },

  create: async (stone: Omit<Stone, 'id'>): Promise<Stone> => {
    const data = await fetchAPI<any>('/api/stones', {
      method: 'POST',
      body: JSON.stringify({
        name: stone.name,
        countPerGram: stone.countPerGram,
      }),
    });
    return transformStone(data);
  },

  update: async (id: string, stone: Partial<Stone>): Promise<Stone> => {
    const data = await fetchAPI<any>(`/api/stones/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: stone.name,
        countPerGram: stone.countPerGram,
      }),
    });
    return transformStone(data);
  },

  delete: async (id: string): Promise<void> => {
    await fetchAPI(`/api/stones/${id}`, {
      method: 'DELETE',
    });
  },
};

// Models API
export const modelsAPI = {
  getAll: async (): Promise<Model[]> => {
    const data = await fetchAPI<any[]>('/api/models');
    return data.map(transformModel);
  },

  create: async (model: Omit<Model, 'id'>): Promise<Model> => {
    const data = await fetchAPI<any>('/api/models', {
      method: 'POST',
      body: JSON.stringify({
        name: model.name,
        stockCode: model.stockCode,
        category: model.category,
        metalType: model.metalType,
        image: model.image,
        stones: model.stones,
      }),
    });
    return transformModel(data);
  },

  update: async (id: string, model: Partial<Model>): Promise<Model> => {
    const data = await fetchAPI<any>(`/api/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: model.name,
        stockCode: model.stockCode,
        category: model.category,
        metalType: model.metalType,
        image: model.image,
        stones: model.stones,
      }),
    });
    return transformModel(data);
  },

  delete: async (id: string): Promise<void> => {
    await fetchAPI(`/api/models/${id}`, {
      method: 'DELETE',
    });
  },
};

// Stone Sets API
export const stoneSetsAPI = {
  getAll: async (): Promise<StoneSet[]> => {
    const data = await fetchAPI<any[]>('/api/stone-sets');
    return data.map(transformStoneSet);
  },

  create: async (stoneSet: Omit<StoneSet, 'id'>): Promise<StoneSet> => {
    const data = await fetchAPI<any>('/api/stone-sets', {
      method: 'POST',
      body: JSON.stringify({
        name: stoneSet.name,
        stones: stoneSet.stones,
      }),
    });
    return transformStoneSet(data);
  },

  update: async (id: string, stoneSet: Partial<StoneSet>): Promise<StoneSet> => {
    const data = await fetchAPI<any>(`/api/stone-sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: stoneSet.name,
        stones: stoneSet.stones,
      }),
    });
    return transformStoneSet(data);
  },

  delete: async (id: string): Promise<void> => {
    await fetchAPI(`/api/stone-sets/${id}`, {
      method: 'DELETE',
    });
  },
};

export const authAPI = {
  login: async (username: string, password: string) => {
    return fetchAPI<{ token: string; user: { id: string; username: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });
  },
};

export interface CompanySettings {
  id: string;
  companyName: string;
  legalName?: string;
  taxOffice?: string;
  taxNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string | null;
  savedLocally?: boolean;
}

const COMPANY_SETTINGS_STORAGE_KEY = 'companySettings';

const defaultCompanySettings = (): CompanySettings => ({
  id: '00000000-0000-0000-0000-000000000000',
  companyName: 'MercanSoft',
  legalName: '',
  taxOffice: '',
  taxNumber: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo: null,
});

const readLocalCompanySettings = (): CompanySettings | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const saved = localStorage.getItem(COMPANY_SETTINGS_STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return { ...defaultCompanySettings(), ...JSON.parse(saved) };
  } catch {
    return null;
  }
};

const writeLocalCompanySettings = (settings: Partial<CompanySettings>): CompanySettings => {
  const { savedLocally: _savedLocally, ...settingsToSave } = settings;
  const merged = { ...defaultCompanySettings(), ...readLocalCompanySettings(), ...settingsToSave, savedLocally: true };
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      COMPANY_SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...settingsToSave })
    );
  }
  return merged;
};

const isCompanySettingsUnavailable = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('404') ||
    message.includes('Cannot GET /api/company-settings') ||
    message.includes('Cannot PUT /api/company-settings')
  );
};

// Company Settings API
export const companySettingsAPI = {
  get: async (): Promise<CompanySettings> => {
    try {
      return await fetchAPI<CompanySettings>('/api/company-settings');
    } catch (error) {
      if (isCompanySettingsUnavailable(error)) {
        return readLocalCompanySettings() ?? defaultCompanySettings();
      }
      throw error;
    }
  },

  update: async (settings: Partial<CompanySettings>): Promise<CompanySettings> => {
    try {
      return await fetchAPI<CompanySettings>('/api/company-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      if (isCompanySettingsUnavailable(error)) {
        return writeLocalCompanySettings(settings);
      }
      throw error;
    }
  },
};

const RECEIPT_SETTINGS_STORAGE_KEY = 'receiptSettings';

const isReceiptSettingsUnavailable = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('404') ||
    message.includes('Cannot GET /api/receipt-settings') ||
    message.includes('Cannot PUT /api/receipt-settings')
  );
};

const readLocalReceiptSettings = (): ReceiptSettings => {
  if (typeof window === 'undefined') {
    return defaultReceiptSettings();
  }

  const saved = localStorage.getItem(RECEIPT_SETTINGS_STORAGE_KEY);
  if (!saved) {
    return defaultReceiptSettings();
  }

  try {
    return mergeReceiptSettings(JSON.parse(saved));
  } catch {
    return defaultReceiptSettings();
  }
};

const writeLocalReceiptSettings = (settings: Partial<ReceiptSettings>): ReceiptSettings => {
  const merged = mergeReceiptSettings({
    ...readLocalReceiptSettings(),
    ...settings,
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  }

  return merged;
};

export const receiptSettingsAPI = {
  get: async (): Promise<ReceiptSettings> => {
    try {
      const response = await fetchAPI<{ settings?: Partial<ReceiptSettings> }>('/api/receipt-settings');
      const merged = mergeReceiptSettings(response.settings || {});
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    } catch (error) {
      if (isReceiptSettingsUnavailable(error)) {
        return readLocalReceiptSettings();
      }
      throw error;
    }
  },

  update: async (settings: ReceiptSettings): Promise<ReceiptSettings> => {
    const merged = mergeReceiptSettings(settings);
    try {
      const response = await fetchAPI<{ settings?: Partial<ReceiptSettings> }>('/api/receipt-settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: merged }),
      });
      const saved = mergeReceiptSettings(response.settings || merged);
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(saved));
      }
      return saved;
    } catch (error) {
      if (isReceiptSettingsUnavailable(error)) {
        return writeLocalReceiptSettings(merged);
      }
      throw error;
    }
  },
};

export interface User {
  id: string;
  username: string;
  created_at?: string;
}

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    return fetchAPI<User[]>('/api/users');
  },

  create: async (user: { username: string; password: string }): Promise<User> => {
    return fetchAPI<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  update: async (id: string, user: { username?: string; password?: string }): Promise<User> => {
    return fetchAPI<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchAPI(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },
};

