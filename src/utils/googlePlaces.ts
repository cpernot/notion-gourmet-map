export interface GooglePlaceSearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string;
  genre: string;
  photoUrl: string;
  googleRating?: number;
  website?: string;
  phone?: string;
  openingHours?: any;
  weekdayDescriptions: string[];
  openDays: string[];
  timeSlots: string[];
  latestCloseHour?: number;
  parkingOptions: {
    freeParkingLot?: boolean;
    paidParkingLot?: boolean;
    freeGarageParking?: boolean;
    paidGarageParking?: boolean;
  };
  isVegan: boolean;
  isVegetarian: boolean;
}

const GENRE_KEYWORD_RULES: [string, string[]][] = [
  ["朝ごはん", ["朝食", "モーニング", "朝ごはん", "breakfast"]],
  ["パン屋", ["ベーカリー", "パン屋", "パン", "ブーランジェリー", "bakery", "bread", "bagel", "ベーグル"]],
  ["カフェ", ["カフェ", "CAFE", "cafe", "珈琲", "喫茶", "コーヒー", "スイーツ", "デザート", "アイス"]],
  ["昼ごはん", ["ランチ", "昼ごはん", "定食", "イタリアン", "パスタ", "ピザ", "ピッツァ", "フレンチ", "洋食"]],
  ["夜ごはん", [
    "ディナー", "夜ごはん", "ラーメン", "つけ麺", "拉麺", "中華そば",
    "居酒屋", "バル", "酒場", "ダイニングバー", "立ち飲み", "バー",
    "和食", "寿司", "鮨", "割烹", "日本料理", "海鮮", "天ぷら",
    "焼肉", "ホルモン", "ステーキ", "中華", "餃子", "飲茶", "うどん", "蕎麦", "そば"
  ]],
];

const GENRE_TYPE_RULES: [string, string[]][] = [
  ["朝ごはん", ["breakfast_restaurant", "breakfast"]],
  ["パン屋", ["bakery"]],
  ["カフェ", ["cafe", "coffee_shop", "dessert_shop", "ice_cream_shop"]],
  ["昼ごはん", ["lunch", "italian_restaurant", "pizza_restaurant", "french_restaurant"]],
  ["夜ごはん", [
    "dinner",
    "ramen_restaurant",
    "izakaya",
    "bar",
    "pub",
    "japanese_restaurant",
    "sushi_restaurant",
    "seafood_restaurant",
    "barbecue_restaurant",
    "chinese_restaurant",
    "yakiniku_restaurant",
    "steak_house"
  ]],
];

export function mapGenre(types: string[] = [], name: string = ""): string {
  // 1. 店名キーワードからの判定
  for (const [genre, keywords] of GENRE_KEYWORD_RULES) {
    for (const kw of keywords) {
      if (name.includes(kw)) {
        return genre;
      }
    }
  }

  // 2. Google Places types からの判定
  const typeSet = new Set(types);
  for (const [genre, gTypes] of GENRE_TYPE_RULES) {
    for (const t of gTypes) {
      if (typeSet.has(t)) {
        return genre;
      }
    }
  }

  return "その他";
}

const DAY_ORDER = ["月", "火", "水", "木", "金", "土", "日"];
const DAY_INDEX_TO_NAME: Record<number, string> = {
  1: "月",
  2: "火",
  3: "水",
  4: "木",
  5: "金",
  6: "土",
  0: "日",
};

export function extractOperatingSchedule(openingHours: any): {
  openDays: string[];
  timeSlots: string[];
  latestClose: number | undefined;
} {
  if (!openingHours) {
    return { openDays: [], timeSlots: [], latestClose: undefined };
  }

  const periods: any[] = openingHours.periods || [];
  const weekdayDescriptions: string[] = openingHours.weekdayDescriptions || [];

  const openDaysSet = new Set<string>();
  const timeSlotsSet = new Set<string>();
  let latestClose: number | undefined = undefined;

  if (periods && periods.length > 0) {
    for (const p of periods) {
      const openInfo = p.open || {};
      const closeInfo = p.close || {};

      const openDay = openInfo.day;
      if (typeof openDay === "number" && DAY_INDEX_TO_NAME[openDay]) {
        openDaysSet.add(DAY_INDEX_TO_NAME[openDay]);
      }

      const openHour = typeof openInfo.hour === "number" ? openInfo.hour : 0;
      const closeHour = typeof closeInfo.hour === "number" ? closeInfo.hour : 24;

      // 24時間営業判定
      const is24h =
        (!p.close && p.open) ||
        (openHour === 0 && closeHour === 0 && openInfo.minute === 0 && closeInfo.minute === 0);

      if (is24h) {
        ["🌅 朝", "🥐 モーニング", "☀️ ランチ", "☕ カフェ", "🌙 ディナー", "🌃 深夜営業"].forEach(
          (t) => timeSlotsSet.add(t)
        );
        latestClose = 24;
        continue;
      }

      const closeEffective = closeHour >= openHour ? closeHour : closeHour + 24;

      if (openHour < 10) {
        timeSlotsSet.add("🌅 朝");
      }
      if (openHour <= 10 && closeEffective >= 11) {
        timeSlotsSet.add("🥐 モーニング");
      }
      if (openHour < 14 && closeEffective >= 12) {
        timeSlotsSet.add("☀️ ランチ");
      }
      if (openHour < 17 && closeEffective >= 15) {
        timeSlotsSet.add("☕ カフェ");
      }
      if (openHour < 22 && closeEffective >= 18) {
        timeSlotsSet.add("🌙 ディナー");
      }
      if (closeEffective >= 23 || (closeHour < 6 && closeHour > 0)) {
        timeSlotsSet.add("🌃 深夜営業");
      }

      if (latestClose === undefined || closeEffective > latestClose) {
        latestClose = closeEffective;
      }
    }
  }

  // periodsがない場合のweekdayDescriptionsフォールバック
  if (openDaysSet.size === 0 && weekdayDescriptions.length > 0) {
    for (const desc of weekdayDescriptions) {
      for (const dayStr of DAY_ORDER) {
        const label = `${dayStr}曜日`;
        if (desc.includes(label) && !desc.includes("定休") && !desc.includes("休業")) {
          openDaysSet.add(dayStr);
        }
      }
    }
  }

  const openDays = DAY_ORDER.filter((d) => openDaysSet.has(d));
  const timeSlotsOrder = ["🌅 朝", "🥐 モーニング", "☀️ ランチ", "☕ カフェ", "🌙 ディナー", "🌃 深夜営業"];
  const timeSlots = timeSlotsOrder.filter((t) => timeSlotsSet.has(t));

  return { openDays, timeSlots, latestClose };
}
