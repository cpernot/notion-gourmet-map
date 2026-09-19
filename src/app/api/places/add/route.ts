import { NextResponse } from "next/server";
import { Place } from "@/types/place";
import { GooglePlaceSearchResult } from "@/utils/googlePlaces";

export async function POST(request: Request) {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !databaseId) {
    return NextResponse.json(
      { error: "NOTION_TOKEN または NOTION_DATABASE_ID が設定されていません。" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      place,
      genre,
      visitDate,
      rating,
      notes,
    }: {
      place: GooglePlaceSearchResult;
      genre?: string;
      visitDate?: string;
      rating?: string;
      notes?: string;
    } = body;

    if (!place || !place.name) {
      return NextResponse.json(
        { error: "店舗データが不正です。" },
        { status: 400 }
      );
    }

    // 駐車場タグの生成
    const parkingItems: string[] = [];
    if (place.parkingOptions?.freeParkingLot) parkingItems.push("無料駐車場あり");
    if (place.parkingOptions?.paidParkingLot) parkingItems.push("有料駐車場あり");
    if (place.parkingOptions?.freeGarageParking) parkingItems.push("無料屋内・立体駐車場あり");
    if (place.parkingOptions?.paidGarageParking) parkingItems.push("有料屋内・立体駐車場あり");

    // 食事対応タグの生成
    const dietaryItems: string[] = [];
    if (place.isVegan) dietaryItems.push("🌱 ビーガン対応あり");
    if (place.isVegetarian) dietaryItems.push("🥗 ベジタリアン対応あり");

    // 本文ブロック群の構築
    const children: any[] = [];

    // メモが入力されている場合は目立つコールアウトとして先頭に追加
    if (notes && notes.trim()) {
      children.push({
        object: "block",
        type: "callout",
        callout: {
          icon: { type: "emoji", emoji: "📝" },
          rich_text: [{ text: { content: notes.trim() } }],
        },
      });
    }

    // 基本情報セクション
    children.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ text: { content: "店舗情報" } }],
      },
    });

    children.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [{ text: { content: `住所: ${place.address || "未設定"}` } }],
      },
    });

    if (place.phone) {
      children.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: `電話番号: ${place.phone}` } }],
        },
      });
    }

    if (place.googleRating) {
      children.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: `Google評価: ⭐ ${place.googleRating}` } }],
        },
      });
    }

    if (parkingItems.length > 0) {
      children.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: `🅿️ 駐車場: ${parkingItems.join(", ")}` } }],
        },
      });
    }

    if (dietaryItems.length > 0) {
      children.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: `🍽️ 食事対応: ${dietaryItems.join(", ")}` } }],
        },
      });
    }

    // 営業時間
    if (place.weekdayDescriptions && place.weekdayDescriptions.length > 0) {
      children.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ text: { content: "🕒 営業時間" } }],
        },
      });
      for (const desc of place.weekdayDescriptions) {
        children.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ text: { content: desc } }],
          },
        });
      }
    }

    if (place.website) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { text: { content: "🌐 公式サイト: " } },
            { text: { content: place.website, link: { url: place.website } } },
          ],
        },
      });
    }

    if (place.mapsUrl) {
      children.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "🗺️ 地図" } }],
        },
      });
      children.push({
        object: "block",
        type: "embed",
        embed: {
          url: place.mapsUrl,
        },
      });
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { text: { content: "🔗 ブラウザで開く: " } },
            { text: { content: place.mapsUrl, link: { url: place.mapsUrl } } },
          ],
        },
      });
    }

    // プロパティの設定
    const finalGenre = genre || place.genre || "その他";
    const properties: Record<string, any> = {
      名前: {
        title: [{ text: { content: place.name } }],
      },
      ジャンル: {
        select: { name: finalGenre },
      },
    };

    if (place.address) {
      properties["住所"] = {
        rich_text: [{ text: { content: place.address } }],
      };
    }

    if (visitDate) {
      properties["訪問日"] = {
        date: { start: visitDate },
      };
    }

    if (rating) {
      properties["評価"] = {
        select: { name: rating },
      };
    }

    if (place.mapsUrl) {
      properties["マップ"] = {
        url: place.mapsUrl,
      };
    }

    if (place.photoUrl) {
      properties["photo_url"] = {
        files: [
          {
            name: `${place.name}_photo.jpg`,
            type: "external",
            external: { url: place.photoUrl },
          },
        ],
      };
    }

    if (place.openDays && place.openDays.length > 0) {
      properties["営業曜日"] = {
        multi_select: place.openDays.map((d) => ({ name: d })),
      };
    }

    if (place.timeSlots && place.timeSlots.length > 0) {
      properties["時間帯"] = {
        multi_select: place.timeSlots.map((t) => ({ name: t })),
      };
    }

    if (typeof place.latestCloseHour === "number") {
      properties["閉店時間"] = {
        number: place.latestCloseHour,
      };
    }

    if (parkingItems.length > 0) {
      properties["駐車場"] = {
        multi_select: parkingItems.map((p) => ({ name: p })),
      };
    }

    if (dietaryItems.length > 0) {
      properties["食事対応"] = {
        multi_select: dietaryItems.map((d) => ({ name: d })),
      };
    }

    // ヴィーガン・ベジタリアン
    if (place.isVegan) {
      properties["ヴィーガン・ベジタリアン"] = {
        select: { name: "🌱 ビーガン対応" },
      };
    } else if (place.isVegetarian) {
      properties["ヴィーガン・ベジタリアン"] = {
        select: { name: "🥗 ベジタリアン対応" },
      };
    } else {
      properties["ヴィーガン・ベジタリアン"] = {
        select: { name: "不明" },
      };
    }

    // Latitude & Longitude (rich_text)
    if (typeof place.latitude === "number") {
      properties["Latitude"] = {
        rich_text: [{ text: { content: String(place.latitude) } }],
      };
    }
    if (typeof place.longitude === "number") {
      properties["Longitude"] = {
        rich_text: [{ text: { content: String(place.longitude) } }],
      };
    }

    // Notion APIリクエスト
    const payload: any = {
      parent: { database_id: databaseId },
      properties,
      children,
    };

    if (place.photoUrl) {
      payload.cover = {
        type: "external",
        external: { url: place.photoUrl },
      };
    }

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!notionRes.ok) {
      const errText = await notionRes.text();
      console.error("Notion page creation error:", notionRes.status, errText);
      return NextResponse.json(
        { error: `Notion登録エラー (${notionRes.status}): ${errText}` },
        { status: notionRes.status }
      );
    }

    const createdPage = await notionRes.json();
    const notionUrl =
      createdPage.url || `https://www.notion.so/${createdPage.id.replace(/-/g, "")}`;

    const newPlace: Place = {
      id: createdPage.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      rating: rating || "",
      genre: finalGenre,
      openDays: place.openDays || [],
      timeSlots: place.timeSlots || [],
      closeHour: place.latestCloseHour,
      isVegan: place.isVegan,
      isVegetarian: place.isVegetarian,
      parking: parkingItems,
      coverUrl: place.photoUrl || undefined,
      mapsUrl: place.mapsUrl || undefined,
      notionUrl,
      phone: place.phone,
    };

    return NextResponse.json({ success: true, place: newPlace });
  } catch (error: any) {
    console.error("Add place error:", error);
    return NextResponse.json(
      { error: error?.message || "店舗の登録中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
