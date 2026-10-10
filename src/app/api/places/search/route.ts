import { NextResponse } from "next/server";
import {
  mapGenre,
  mapGenres,
  extractOperatingSchedule,
  GooglePlaceSearchResult,
  determineChainType,
} from "@/utils/googlePlaces";

// ジャンル別プレースホルダー画像 (Unsplash CDN静的リンク・完全無料)
const DEFAULT_PLACEHOLDERS: Record<string, string> = {
  "カフェ": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
  "パン屋": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
  "ラーメン": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  "イタリアン": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  "和食": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1200&q=80",
  "中華": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
  "焼肉": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
  "居酒屋": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
  "朝ごはん": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80",
  "昼ごはん": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
  "夜ごはん": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "その他": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
};

/**
 * ホットペッパーグルメAPIから完全無料・静的リンクの店舗写真URLを取得する
 * 見つからない場合はジャンル別プレースホルダー画像を返す
 * ※ Google Places APIの写真（places.photos）は一切呼び出しません
 */
async function getHotpepperPhoto(
  name: string,
  latitude: number | null,
  longitude: number | null,
  phone: string | undefined,
  genre: string
): Promise<string> {
  const hotpepperKey = process.env.HOTPEPPER_API_KEY;
  if (hotpepperKey) {
    const baseUrl = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";

    // 1. 電話番号での検索
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone) {
        try {
          const res = await fetch(`${baseUrl}?key=${hotpepperKey}&tel=${cleanPhone}&format=json&count=1`, {
            cache: "no-store",
          });
          if (res.ok) {
            const data = await res.json();
            const shop = data.results?.shop?.[0];
            if (shop?.photo?.pc?.l) return shop.photo.pc.l;
          }
        } catch (_) {}
      }
    }

    // 2. 緯度経度 + 店名キーワード検索 (1000m以内)
    if (latitude !== null && longitude !== null) {
      const shortName = name.split(/[\s　・\(\)（）]/)[0] || name;
      const query = shortName.length >= 2 ? shortName : name;
      try {
        const url = `${baseUrl}?key=${hotpepperKey}&lat=${latitude}&lng=${longitude}&range=3&keyword=${encodeURIComponent(
          query
        )}&format=json&count=1`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const shop = data.results?.shop?.[0];
          if (shop?.photo?.pc?.l) return shop.photo.pc.l;
        }
      } catch (_) {}
    }

    // 3. 店名キーワード単体での検索
    if (name) {
      try {
        const url = `${baseUrl}?key=${hotpepperKey}&keyword=${encodeURIComponent(name.trim())}&format=json&count=1`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const shop = data.results?.shop?.[0];
          if (shop?.photo?.pc?.l) return shop.photo.pc.l;
        }

        const shortName = name.split(/[\s　・\(\)（）]/)[0];
        if (shortName && shortName !== name.trim() && shortName.length >= 2) {
          const shortUrl = `${baseUrl}?key=${hotpepperKey}&keyword=${encodeURIComponent(
            shortName
          )}&format=json&count=1`;
          const shortRes = await fetch(shortUrl, { cache: "no-store" });
          if (shortRes.ok) {
            const shortData = await shortRes.json();
            const shop = shortData.results?.shop?.[0];
            if (shop?.photo?.pc?.l) return shop.photo.pc.l;
          }
        }
      } catch (_) {}
    }
  }

  return DEFAULT_PLACEHOLDERS[genre] || DEFAULT_PLACEHOLDERS["その他"];
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const masterProxyUrl =
    process.env.SHARED_SEARCH_PROXY_URL ||
    "https://notion-gourmet-map.vercel.app/api/places/search";

  try {
    const body = await request.json();
    const { query } = body;
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "検索キーワードを入力してください。" },
        { status: 400 }
      );
    }

    // If no API key is configured on this instance, proxy to the master deployment
    if (!apiKey) {
      console.log("No local GOOGLE_PLACES_API_KEY found. Forwarding to master proxy:", masterProxyUrl);
      try {
        const proxyRes = await fetch(masterProxyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim() }),
        });
        const proxyData = await proxyRes.json();
        return NextResponse.json(proxyData, { status: proxyRes.status });
      } catch (proxyErr: any) {
        console.error("Proxy error:", proxyErr);
        return NextResponse.json(
          {
            error:
              "Google Places API キーが未設定で、共有検索プロキシへの接続にも失敗しました。",
          },
          { status: 502 }
        );
      }
    }

    const url = "https://places.googleapis.com/v1/places:searchText";
    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.types," +
        "places.rating,places.userRatingCount,places.businessStatus,places.googleMapsUri,places.websiteUri," +
        "places.nationalPhoneNumber,places.regularOpeningHours," +
        "places.parkingOptions,places.servesVegetarianFood,places.location,places.reviews,places.allowsDogs",
    };

    const payload = {
      textQuery: query.trim(),
      languageCode: "ja",
      maxResultCount: 5,
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Google Places API error:", res.status, errText);
      return NextResponse.json(
        { error: `Google Places API エラー (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawPlaces = data.places || [];

    const results: GooglePlaceSearchResult[] = await Promise.all(
      rawPlaces.map(async (place: any) => {
        const name = place.displayName?.text || "";
        const address = place.formattedAddress || "";
        const mapsUrl = place.googleMapsUri || "";
        const types: string[] = place.types || [];
        const googleRating = typeof place.rating === "number" ? place.rating : undefined;
        const userRatingCount = typeof place.userRatingCount === "number" ? place.userRatingCount : undefined;
        const businessStatus = place.businessStatus || "OPERATIONAL";
        const website = place.websiteUri || undefined;
        const phone = place.nationalPhoneNumber || undefined;

        // 最新クチコミ日 (YYYY-MM-DD)
        let latestReviewDate: string | undefined = undefined;
        if (Array.isArray(place.reviews) && place.reviews.length > 0) {
          const sortedReviews = [...place.reviews].sort((a, b) =>
            (b.publishTime || "").localeCompare(a.publishTime || "")
          );
          if (sortedReviews[0]?.publishTime) {
            latestReviewDate = sortedReviews[0].publishTime.slice(0, 10);
          }
        }

        const chainType = determineChainType(name);

        const loc = place.location || {};
        const latitude = typeof loc.latitude === "number" ? loc.latitude : null;
        const longitude = typeof loc.longitude === "number" ? loc.longitude : null;

        const genres = mapGenres(types, name);
        const genre = genres[0] || "その他";

        // ホットペッパーグルメAPIから完全無料・静的リンク写真を取得 (Google places.photosは一切不使用)
        const photoUrl = await getHotpepperPhoto(name, latitude, longitude, phone, genre);

        const openingHours = place.regularOpeningHours || null;
        const weekdayDescriptions: string[] = openingHours?.weekdayDescriptions || [];
        const { openDays, timeSlots, latestClose } = extractOperatingSchedule(openingHours);

        const parkingOptions = place.parkingOptions || {};

        const isVegan =
          place.servesVeganFood === true ||
          types.includes("vegan_restaurant") ||
          ["vegan", "ビーガン", "ヴィーガン"].some((kw) => name.toLowerCase().includes(kw));

        const isVegetarian =
          place.servesVegetarianFood === true ||
          types.includes("vegetarian_restaurant") ||
          isVegan;

        const reviewsText = Array.isArray(place.reviews)
          ? place.reviews.map((r: any) => r.text?.text || "").join(" ")
          : "";
        const lowerAll = (name + " " + reviewsText).toLowerCase();

        const allowsDogs =
          place.allowsDogs === true ||
          types.includes("dog_cafe") ||
          ["ドッグカフェ", "ペット可", "ペット同伴", "ペットok", "犬同伴", "愛犬"].some((kw) =>
            lowerAll.includes(kw)
          );

        return {
          id: place.id,
          name,
          address,
          latitude,
          longitude,
          mapsUrl,
          genre,
          genres,
          photoUrl,
          googleRating,
          userRatingCount,
          businessStatus,
          latestReviewDate,
          chainType,
          website,
          phone,
          openingHours,
          weekdayDescriptions,
          openDays,
          timeSlots,
          latestCloseHour: latestClose,
          parkingOptions: {
            freeParkingLot: parkingOptions.freeParkingLot === true,
            paidParkingLot: parkingOptions.paidParkingLot === true,
            freeGarageParking: parkingOptions.freeGarageParking === true,
            paidGarageParking: parkingOptions.paidGarageParking === true,
          },
          isVegan,
          isVegetarian,
          allowsDogs,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Search endpoint error:", error);
    return NextResponse.json(
      { error: error?.message || "検索処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
