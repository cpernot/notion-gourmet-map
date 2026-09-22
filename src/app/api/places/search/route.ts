import { NextResponse } from "next/server";
import {
  mapGenre,
  mapGenres,
  extractOperatingSchedule,
  GooglePlaceSearchResult,
} from "@/utils/googlePlaces";

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
        "places.rating,places.googleMapsUri,places.photos,places.websiteUri," +
        "places.nationalPhoneNumber,places.regularOpeningHours," +
        "places.parkingOptions,places.servesVegetarianFood,places.location",
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

    const results: GooglePlaceSearchResult[] = rawPlaces.map((place: any) => {
      const name = place.displayName?.text || "";
      const address = place.formattedAddress || "";
      const mapsUrl = place.googleMapsUri || "";
      const types: string[] = place.types || [];
      const googleRating = typeof place.rating === "number" ? place.rating : undefined;
      const website = place.websiteUri || undefined;
      const phone = place.nationalPhoneNumber || undefined;

      const loc = place.location || {};
      const latitude = typeof loc.latitude === "number" ? loc.latitude : null;
      const longitude = typeof loc.longitude === "number" ? loc.longitude : null;

      let photoUrl = "";
      if (place.photos && place.photos.length > 0 && place.photos[0].name) {
        photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=800&key=${apiKey}`;
      }

      const genres = mapGenres(types, name);
      const genre = genres[0] || "その他";

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
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Search endpoint error:", error);
    return NextResponse.json(
      { error: error?.message || "検索処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
