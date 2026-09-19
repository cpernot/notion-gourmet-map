export interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rating?: string;
  genre?: string;
  openDays: string[];
  timeSlots: string[];
  openHour?: number;
  closeHour?: number;
  isVegan: boolean;
  isVegetarian: boolean;
  parking: string[];
  coverUrl?: string;
  mapsUrl?: string;
  notionUrl: string;
  phone?: string;
}

export interface FilterState {
  genre: string;          // 'all' | 'カフェ' | 'イタリアン' | ...
  rating: string;         // 'all' | '5' | '4' | '3'
  day: string;            // 'all' | '月' | '火' | ...
  timeSlot: string;       // 'all' | '🌅 朝' | '🥐 モーニング' | ...
  veganOnly: boolean;
  parkingOnly: boolean;
}
