// Taş türü için tip tanımı
export interface Stone {
  id: string;
  name: string;
  countPerGram: number; // 1 gramda kaç adet taş olduğu
}

// Taş seti için tip tanımı
export interface StoneSet {
  id: string;
  name: string;
  stones: Array<{
    stoneId: string;
    quantity: number;
  }>;
}

// Model için tip tanımı
export interface Model {
  id: string;
  name: string;
  stockCode?: string; // Opsiyonel stok kodu
  category?: string; // Opsiyonel kategori
  image?: string; // Base64 formatında resim
  stones: Array<{
    stoneId: string;
    quantity: number;
  }>;
}

// Hesaplama sonucu için tip tanımı
export interface CalculationResult {
  modelId: string;
  modelName: string;
  productionCount: number;
  totalWeight: number;
  stoneDetails: Array<{
    stoneId: string;
    stoneName: string;
    quantity: number;
    totalWeight: number;
  }>;
}

// Hesaplama geçmişi öğesi için tip tanımı
export interface CalculationHistoryItem {
  id: string;
  modelName: string;
  productionCount: number;
  totalWeight: number;
  timestamp: string; // ISO date string
}

// Uygulama durumu için tip tanımı
export interface AppState {
  stones: Stone[];
  models: Model[];
  stoneSets: StoneSet[];
  selectedModelId: string | null;
  productionCount: number;
  calculationResult: CalculationResult | null;
  calculationHistory: CalculationHistoryItem[];
} 