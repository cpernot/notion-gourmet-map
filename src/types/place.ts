export interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rating?: string;
  genre?: string;
  genres?: string[];
  cuisineGenres?: string[];
  openDays: string[];
  timeSlots: string[];
  openHour?: number;
  closeHour?: number;
  isVegan: boolean;
  isAllVegan?: boolean;
  isVegetarian: boolean;
  isChain: boolean;
  parking: string[];
  petsAllowed?: boolean;
  coverUrl?: string;
  mapsUrl?: string;
  websiteUrl?: string;
  notionUrl: string;
  phone?: string;
}

export interface FilterState {
  genres: string[];          // 空配列なら全ジャンル
  ratings: string[];         // 空配列なら全評価 ('5' | '4' | '3' | '2' | '1')
  days: string[];            // 空配列なら全曜日 ('月' | '火' | '水' | ...)
  timeSlots: string[];       // 空配列なら全時間帯 ('🌅 朝' | '🥐 モーニング' | ...)
  chainOnly: boolean;        // チェーン店のみ
  openNow: boolean;          // 今営業中のみ
  veganOnly?: boolean;
  parkingOnly: boolean;
  petOnly: boolean;          // ペット可能のみ
}
