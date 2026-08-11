import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Model, Stone, StoneSet, CalculationResult, CalculationHistoryItem } from '../types';
import { stonesAPI, modelsAPI, stoneSetsAPI } from '../lib/api';
import { inferMetalTypeFromName, resolveMetalType } from '../lib/metalType';

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (error) {
      console.warn('crypto.randomUUID başarısız, uuidv4 kullanılacak.', error);
    }
  }
  return uuidv4();
};

// Predefined stones kaldırıldı - Tüm veriler backend'den gelecek

const initialState: AppState = {
  stones: [], // Backend'den yüklenecek
  models: [],
  stoneSets: [],
  selectedModelId: null,
  productionCount: 0,
  calculationResult: null,
  calculationHistory: [],
};

// Backend'den veri çekme fonksiyonu
const syncFromBackend = async (set: any) => {
  try {
    console.log('🔄 Backend\'den veri çekiliyor...');
    const [stones, models, stoneSets] = await Promise.all([
      stonesAPI.getAll().catch((err) => {
        console.error('❌ Taşlar yüklenemedi:', err);
        console.error('❌ Hata detayı:', err.message);
        return [];
      }),
      modelsAPI.getAll().catch((err) => {
        console.error('❌ Modeller yüklenemedi:', err);
        console.error('❌ Hata detayı:', err.message);
        return [];
      }),
      stoneSetsAPI.getAll().catch((err) => {
        console.error('❌ Taş setleri yüklenemedi:', err);
        console.error('❌ Hata detayı:', err.message);
        return [];
      }),
    ]);

    console.log(`✅ Veriler yüklendi: ${stones.length} taş, ${models.length} model, ${stoneSets.length} taş seti`);

    // Sadece backend'den gelen verileri kullan
    const allStones: Stone[] = stones && stones.length > 0 ? stones : [];
    
    if (allStones.length > 0) {
      console.log(`📦 Backend'den ${allStones.length} taş yüklendi`);
    } else {
      console.warn('⚠️ Backend\'den taş gelmedi, taş listesi boş');
      console.warn('⚠️ Bu durum normal olabilir (henüz veri eklenmemiş) veya backend bağlantı sorunu olabilir');
    }

    console.log(`📊 Toplam ${allStones.length} taş store'a eklendi`);

    const modelsWithMetalType = (models || []).map((model) => {
      if (model.metalType) {
        return model;
      }
      const inferredMetalType = inferMetalTypeFromName(model.name);
      return inferredMetalType ? { ...model, metalType: inferredMetalType } : model;
    });

    modelsWithMetalType.forEach((model) => {
      const original = (models || []).find((item) => item.id === model.id);
      if (original && !original.metalType && model.metalType) {
        modelsAPI.update(model.id, { metalType: model.metalType }).catch((error) => {
          console.error(`Model metal türü kaydedilemedi (${model.name}):`, error);
        });
      }
    });

    set({
      stones: allStones,
      models: modelsWithMetalType,
      stoneSets: stoneSets || [],
    });
  } catch (error: any) {
    console.error('❌ Backend senkronizasyon hatası:', error);
    console.error('❌ Hata mesajı:', error?.message);
    // Hata durumunda boş liste kullan
    set({
      stones: [],
      models: [],
      stoneSets: [],
    });
  }
};

export const useStore = create<
  AppState & {
    // Taş işlemleri
    addStone: (stone: Omit<Stone, 'id'>) => Promise<void>;
    updateStone: (id: string, stone: Partial<Stone>) => Promise<void>;
    deleteStone: (id: string) => Promise<void>;

    // Model işlemleri
    addModel: (model: Omit<Model, 'id'>) => Promise<void>;
    updateModel: (id: string, model: Partial<Model>) => Promise<void>;
    deleteModel: (id: string) => Promise<void>;

    // Taş seti işlemleri
    addStoneSet: (stoneSet: Omit<StoneSet, 'id'>) => Promise<void>;
    updateStoneSet: (id: string, stoneSet: Partial<StoneSet>) => Promise<void>;
    deleteStoneSet: (id: string) => Promise<void>;

    // Hesaplama işlemleri
    setSelectedModelId: (id: string | null) => void;
    setProductionCount: (count: number) => void;
    calculateTotalWeight: () => void;

    // Veri işlemleri
    exportData: () => string;
    importData: (data: string) => void;
    resetStore: () => void;
    
    // Backend senkronizasyonu
    syncFromBackend: () => Promise<void>;
    isSyncing: boolean;
  }
>(
  persist(
    (set, get) => ({
      ...initialState,
      isSyncing: false,

      // Taş işlemleri
      addStone: async (stone) => {
        try {
          const newStone = await stonesAPI.create(stone);
          set((state) => ({
            stones: [...state.stones, newStone],
          }));
        } catch (error) {
          console.error('Taş ekleme hatası:', error);
          // Fallback: Local storage'a ekle
          set((state) => ({
            stones: [...state.stones, { ...stone, id: generateId() }],
          }));
        }
      },
      updateStone: async (id, stone) => {
        try {
          const updatedStone = await stonesAPI.update(id, stone);
          set((state) => ({
            stones: state.stones.map((s) => (s.id === id ? updatedStone : s)),
          }));
        } catch (error) {
          console.error('Taş güncelleme hatası:', error);
          // Fallback: Local storage'da güncelle
          set((state) => ({
            stones: state.stones.map((s) => (s.id === id ? { ...s, ...stone } : s)),
          }));
        }
      },
      deleteStone: async (id) => {
        try {
          await stonesAPI.delete(id);
          set((state) => ({
            stones: state.stones.filter((s) => s.id !== id),
          }));
        } catch (error) {
          console.error('Taş silme hatası:', error);
          // Fallback: Local storage'dan sil
          set((state) => ({
            stones: state.stones.filter((s) => s.id !== id),
          }));
        }
      },

      // Model işlemleri
      addModel: async (model) => {
        const payload = {
          ...model,
          metalType: resolveMetalType(model.name, model.metalType),
        };
        try {
          const newModel = await modelsAPI.create(payload);
          set((state) => ({
            models: [...state.models, newModel],
          }));
        } catch (error) {
          console.error('Model ekleme hatası:', error);
          set((state) => ({
            models: [...state.models, { ...payload, id: generateId() }],
          }));
        }
      },
      updateModel: async (id, model) => {
        const existing = get().models.find((item) => item.id === id);
        const nextName = model.name ?? existing?.name ?? '';
        const payload = {
          ...model,
          metalType: resolveMetalType(nextName, model.metalType ?? existing?.metalType),
        };
        try {
          const updatedModel = await modelsAPI.update(id, payload);
          set((state) => ({
            models: state.models.map((m) => (m.id === id ? updatedModel : m)),
          }));
        } catch (error) {
          console.error('Model güncelleme hatası:', error);
          set((state) => ({
            models: state.models.map((m) => (m.id === id ? { ...m, ...payload } : m)),
          }));
        }
      },
      deleteModel: async (id) => {
        try {
          await modelsAPI.delete(id);
          set((state) => ({
            models: state.models.filter((m) => m.id !== id),
          }));
        } catch (error) {
          console.error('Model silme hatası:', error);
          // Fallback: Local storage'dan sil
          set((state) => ({
            models: state.models.filter((m) => m.id !== id),
          }));
        }
      },

      // Taş seti işlemleri
      addStoneSet: async (stoneSet) => {
        try {
          const newStoneSet = await stoneSetsAPI.create(stoneSet);
          set((state) => ({
            stoneSets: [...state.stoneSets, newStoneSet],
          }));
        } catch (error) {
          console.error('Taş seti ekleme hatası:', error);
          // Fallback: Local storage'a ekle
          set((state) => ({
            stoneSets: [...state.stoneSets, { ...stoneSet, id: generateId() }],
          }));
        }
      },
      updateStoneSet: async (id, stoneSet) => {
        try {
          const updatedStoneSet = await stoneSetsAPI.update(id, stoneSet);
          set((state) => ({
            stoneSets: state.stoneSets.map((s) => (s.id === id ? updatedStoneSet : s)),
          }));
        } catch (error) {
          console.error('Taş seti güncelleme hatası:', error);
          // Fallback: Local storage'da güncelle
          set((state) => ({
            stoneSets: state.stoneSets.map((s) => (s.id === id ? { ...s, ...stoneSet } : s)),
          }));
        }
      },
      deleteStoneSet: async (id) => {
        try {
          await stoneSetsAPI.delete(id);
          set((state) => ({
            stoneSets: state.stoneSets.filter((s) => s.id !== id),
          }));
        } catch (error) {
          console.error('Taş seti silme hatası:', error);
          // Fallback: Local storage'dan sil
          set((state) => ({
            stoneSets: state.stoneSets.filter((s) => s.id !== id),
          }));
        }
      },

      // Hesaplama işlemleri
      setSelectedModelId: (id) => {
        set({ selectedModelId: id });
        // localStorage kullanımını azaltmak için hesaplama sonucunu temizle
        set({ calculationResult: null });
      },
      setProductionCount: (count) => set({ productionCount: count }),
      calculateTotalWeight: () => {
        const { stones, models, selectedModelId, productionCount } = get();

        if (!selectedModelId || productionCount <= 0) {
          set({ calculationResult: null });
          return;
        }

        const selectedModel = models.find((m) => m.id === selectedModelId);
        if (!selectedModel) {
          set({ calculationResult: null });
          return;
        }

        const stoneDetails = selectedModel.stones.map((modelStone) => {
          const stone = stones.find((s) => s.id === modelStone.stoneId);
          const quantity = modelStone.quantity * productionCount;
          
          // 1 gramda kaç adet taş olduğu bilgisinden tek taş ağırlığını hesapla
          let singleStoneWeight = 0;
          if (stone && stone.countPerGram && stone.countPerGram > 0) {
            singleStoneWeight = 1 / stone.countPerGram;
          } else {
            console.warn(`Taş bulunamadı veya countPerGram geçersiz:`, {
              stoneId: modelStone.stoneId,
              stone: stone,
              countPerGram: stone?.countPerGram
            });
          }
          
          const totalWeight = singleStoneWeight * quantity;
          
          return {
            stoneId: modelStone.stoneId,
            stoneName: stone ? stone.name : 'Bilinmeyen Taş',
            quantity,
            totalWeight: isNaN(totalWeight) ? 0 : totalWeight,
          };
        });

        const totalWeight = stoneDetails.reduce((sum, detail) => {
          const weight = isNaN(detail.totalWeight) ? 0 : detail.totalWeight;
          return sum + weight;
        }, 0);

        const result: CalculationResult = {
          modelId: selectedModelId,
          modelName: selectedModel.name,
          productionCount,
          totalWeight: isNaN(totalWeight) ? 0 : totalWeight,
          stoneDetails,
        };

        set({ calculationResult: result });
      },

      // Veri işlemleri
      exportData: () => {
        const { stones, models, stoneSets } = get();
        return JSON.stringify({ stones, models, stoneSets });
      },
      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          set({
            stones: parsed.stones || [],
            models: parsed.models || [],
            stoneSets: parsed.stoneSets || [],
          });
        } catch (e) {
          console.error('Veri içe aktarma hatası:', e);
        }
      },
      resetStore: () => set(initialState),
      
      // Backend senkronizasyonu
      syncFromBackend: async () => {
        set({ isSyncing: true });
        try {
          await syncFromBackend(set);
        } catch (error) {
          console.error('Sync hatası:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
      
      // Hesaplama geçmişi işlemleri
      addToHistory: (result) => {
        const historyItem: CalculationHistoryItem = {
          id: generateId(),
          modelName: result.modelName,
          productionCount: result.productionCount,
          totalWeight: result.totalWeight,
          timestamp: new Date().toISOString(),
          stoneDetails: result.stoneDetails.map((detail) => ({
            stoneId: detail.stoneId,
            stoneName: detail.stoneName,
            quantity: detail.quantity,
            totalWeight: detail.totalWeight,
          })),
        };
        set((state) => ({
          calculationHistory: [...state.calculationHistory, historyItem],
        }));
      },
      removeFromHistory: (id) => {
        set((state) => ({
          calculationHistory: state.calculationHistory.filter((item) => item.id !== id),
        }));
      },
      clearHistory: () => {
        set({ calculationHistory: [] });
      },
    }),
    {
      name: 'mercansoft-storage',
      // Sadece temel verileri persist et, hesaplama sonuçlarını etme
      partialize: (state) => ({
        // Sadece backend'den gelen verileri kaydet
        stones: state.stones,
        models: state.models,
        stoneSets: state.stoneSets,
        calculationHistory: state.calculationHistory,
      }),
      // LocalStorage'dan veri yüklenirken transform et
      merge: (persistedState: any, currentState: any) => {
        // Eğer localStorage'da veri varsa, taşları transform et
        if (persistedState?.stones && Array.isArray(persistedState.stones)) {
          persistedState.stones = persistedState.stones.map((stone: any) => {
            // Eğer countPerGram yoksa veya undefined ise transform et
            if (stone.countPerGram === undefined || stone.countPerGram === null) {
              if (stone.count_per_gram !== undefined && stone.count_per_gram !== null) {
                const parsed = parseFloat(String(stone.count_per_gram));
                stone.countPerGram = isNaN(parsed) ? 0 : parsed;
              } else {
                stone.countPerGram = 0;
              }
            }
            return stone;
          });
        }
        if (persistedState?.models && Array.isArray(persistedState.models)) {
          persistedState.models = persistedState.models.map((model: Model) => {
            if (model.metalType) {
              return model;
            }
            const inferredMetalType = inferMetalTypeFromName(model.name);
            return inferredMetalType ? { ...model, metalType: inferredMetalType } : model;
          });
        }
        return { ...currentState, ...persistedState };
      },
    }
  )
); 