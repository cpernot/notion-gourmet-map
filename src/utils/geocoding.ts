const geocodeCache = new Map<string, { lat: number; lng: number }>();

/**
 * Google Maps URLから緯度経度を抽出する試行
 */
export function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;

  // パターン 1: !3d35.6648423!4d139.7291565
  const match3d4d = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (match3d4d) {
    const lat = parseFloat(match3d4d[1]);
    const lng = parseFloat(match3d4d[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // パターン 2: @35.6648423,139.7291565
  const matchAt = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchAt) {
    const lat = parseFloat(matchAt[1]);
    const lng = parseFloat(matchAt[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // パターン 3: q=35.6648423,139.7291565 または ll=...
  const matchQuery = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchQuery) {
    const lat = parseFloat(matchQuery[1]);
    const lng = parseFloat(matchQuery[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * 国土地理院 API (GSI) を使用した高精度・高速ジオコーディング（日本国内対応・無料・キー不要）
 */
async function geocodeGsi(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0]?.geometry?.coordinates) {
      const [lng, lat] = data[0].geometry.coordinates;
      if (typeof lat === "number" && typeof lng === "number") {
        return { lat, lng };
      }
    }
  } catch (err) {
    console.error(`GSI geocoding error for ${query}:`, err);
  }
  return null;
}

/**
 * OpenStreetMap Nominatim ジオコーダー（フォールバック）
 */
async function geocodeNominatim(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "NotionGourmetMap/1.0 (contact@example.com)",
        "Accept-Language": "ja",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  } catch (err) {
    console.error(`Nominatim geocoding error for ${query}:`, err);
  }
  return null;
}

/**
 * 住所から座標を特定する（GSI優先、Nominatimフォールバック、キャッシュ付き）
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length === 0) return null;

  // 日本、郵便番号、全角数字等の正規化
  const cleanAddr = address
    .replace(/^日本[、,\s]*/, "")
    .replace(/〒?\s*\d{3}[-‐ー−]\d{4}\s*/g, "")
    .replace(/[\uFF10-\uFF19]/g, (m) => String.fromCharCode(m.charCodeAt(0) - 0xfee0))
    .trim();

  if (geocodeCache.has(cleanAddr)) {
    return geocodeCache.get(cleanAddr)!;
  }

  // クエリ候補リスト（ビル名などを除外した住所）
  const queries: string[] = [];
  const baseQuery = cleanAddr.split(/\s+/)[0]; // スペースより前の住所部分
  if (baseQuery) queries.push(baseQuery);
  if (cleanAddr !== baseQuery) queries.push(cleanAddr);

  for (const q of queries) {
    // 1. 国土地理院 (GSI) を試行
    const gsiCoords = await geocodeGsi(q);
    if (gsiCoords) {
      geocodeCache.set(cleanAddr, gsiCoords);
      return gsiCoords;
    }

    // 2. Nominatim を試行
    const osmCoords = await geocodeNominatim(q);
    if (osmCoords) {
      geocodeCache.set(cleanAddr, osmCoords);
      return osmCoords;
    }
  }

  return null;
}
