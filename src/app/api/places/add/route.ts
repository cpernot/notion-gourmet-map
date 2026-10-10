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

  const serverSecret = process.env.ADMIN_SECRET_KEY;

  try {
    const body = await request.json();
    const {
      place,
      genre,
      genres,
      visitDate,
      rating,
      notes,
      adminKey,
      chainType,
      veganStatus,
      website,
      petsAllowed,
    }: {
      place: GooglePlaceSearchResult;
      genre?: string;
      genres?: string[];
      visitDate?: string;
      rating?: string;
      notes?: string;
      adminKey?: string;
      chainType?: "チェーン店" | "個人店・単独店";
      veganStatus?: "🌱 全てヴィーガン" | "🌱 ビーガン対応あり" | "未対応";
      website?: string;
      petsAllowed?: boolean;
    } = body;

    // 管理者キーの検証 (サーバーにキーが設定されている場合のみ必須)
    const headerAdminKey = request.headers.get("x-admin-key");
    const providedKey = adminKey || headerAdminKey;
    if (serverSecret && providedKey !== serverSecret) {
      return NextResponse.json(
        { error: "店舗を登録する管理者権限がありません。" },
        { status: 403 }
      );
    }

    if (!place || !place.name) {
      return NextResponse.json(
        { error: "店舗データが不正です。" },
        { status: 400 }
      );
    }

    // ペット可能判定
    const finalPetsAllowed =
      typeof petsAllowed === "boolean"
        ? petsAllowed
        : Boolean(place.allowsDogs);

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

    if (finalPetsAllowed) {
      children.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: "🐶 ペット同伴: 可" } }],
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

    // ジャンル（複数対応 & 代表ジャンル判定）
    const finalGenres: string[] =
      genres && genres.length > 0
        ? genres
        : genre
        ? [genre]
        : place.genres && place.genres.length > 0
        ? place.genres
        : [place.genre || "その他"];
    const primaryGenre = finalGenres[0] || "その他";

    // 1. Notion データベースの実際のプロパティ（スキーマ）を取得して安全に適応
    let dbProperties: Record<string, any> = {};
    try {
      const dbRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
        cache: "no-store",
      });
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        dbProperties = dbData.properties || {};
      }
    } catch (e) {
      console.warn("Notion DBスキーマの事前取得に失敗したため、動的リカバリーモードで実行します:", e);
    }

    const hasDbSchema = Object.keys(dbProperties).length > 0;
    const propExists = (name: string) => !hasDbSchema || Boolean(dbProperties[name]);
    const propType = (name: string) => dbProperties[name]?.type;

    // カバー画像URL (静的リンク)
    let resolvedPhotoUrl = place.photoUrl || "";
    if (resolvedPhotoUrl.includes("places.googleapis.com")) {
      resolvedPhotoUrl = "";
    }
    if (!resolvedPhotoUrl) {
      resolvedPhotoUrl =
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";
    }

    // プロパティの設定 (Notionに存在する項目のみ安全にマッピング)
    const properties: Record<string, any> = {};

    // 名前 (必須: title)
    if (propExists("名前")) {
      properties["名前"] = {
        title: [{ text: { content: place.name } }],
      };
    }

    // ジャンル (multi_select または select の型に合わせて自動設定)
    if (propExists("ジャンル")) {
      if (propType("ジャンル") === "select") {
        properties["ジャンル"] = {
          select: { name: primaryGenre },
        };
      } else {
        properties["ジャンル"] = {
          multi_select: finalGenres.map((g) => ({ name: g })),
        };
      }
    }

    // 住所 (rich_text)
    if (place.address && propExists("住所")) {
      properties["住所"] = {
        rich_text: [{ text: { content: place.address } }],
      };
    }

    // 訪問日 (date)
    if (visitDate && propExists("訪問日")) {
      properties["訪問日"] = {
        date: { start: visitDate },
      };
    }

    // 評価 (select)
    if (rating && propExists("評価")) {
      properties["評価"] = {
        select: { name: rating },
      };
    }

    // マップ (url)
    if (place.mapsUrl && propExists("マップ")) {
      properties["マップ"] = {
        url: place.mapsUrl,
      };
    }

    // photo_url (files)
    if (resolvedPhotoUrl && propExists("photo_url")) {
      properties["photo_url"] = {
        files: [
          {
            name: `${place.name}_photo.jpg`,
            type: "external",
            external: { url: resolvedPhotoUrl },
          },
        ],
      };
    }

    // 営業曜日 (multi_select)
    if (place.openDays && place.openDays.length > 0 && propExists("営業曜日")) {
      properties["営業曜日"] = {
        multi_select: place.openDays.map((d) => ({ name: d })),
      };
    }

    // 時間帯 (multi_select)
    if (place.timeSlots && place.timeSlots.length > 0 && propExists("時間帯")) {
      properties["時間帯"] = {
        multi_select: place.timeSlots.map((t) => ({ name: t })),
      };
    }

    // 閉店時間 (number)
    if (typeof place.latestCloseHour === "number" && propExists("閉店時間")) {
      properties["閉店時間"] = {
        number: place.latestCloseHour,
      };
    }

    // 駐車場 (multi_select または select)
    if (parkingItems.length > 0 && propExists("駐車場")) {
      if (propType("駐車場") === "select") {
        properties["駐車場"] = {
          select: { name: parkingItems[0] },
        };
      } else {
        properties["駐車場"] = {
          multi_select: parkingItems.map((p) => ({ name: p })),
        };
      }
    }

    // Latitude & Longitude (rich_text または number に自動適応)
    if (typeof place.latitude === "number" && propExists("Latitude")) {
      if (propType("Latitude") === "number") {
        properties["Latitude"] = { number: place.latitude };
      } else {
        properties["Latitude"] = {
          rich_text: [{ text: { content: String(place.latitude) } }],
        };
      }
    }
    if (typeof place.longitude === "number" && propExists("Longitude")) {
      if (propType("Longitude") === "number") {
        properties["Longitude"] = { number: place.longitude };
      } else {
        properties["Longitude"] = {
          rich_text: [{ text: { content: String(place.longitude) } }],
        };
      }
    }

    // ヴィーガン関連 (Notionの列名に合わせて柔軟に適応)
    const finalVegan =
      veganStatus || (place.isVegan ? "🌱 ビーガン対応あり" : "未対応");

    if (propExists("ヴィーガン")) {
      properties["ヴィーガン"] = {
        select: { name: finalVegan },
      };
    } else if (propExists("ヴィーガン・ベジタリアン")) {
      properties["ヴィーガン・ベジタリアン"] = {
        select: { name: finalVegan },
      };
    } else if (propExists("食事対応") && dietaryItems.length > 0) {
      if (propType("食事対応") === "multi_select") {
        properties["食事対応"] = {
          multi_select: dietaryItems.map((d) => ({ name: d })),
        };
      }
    }

    // 公式サイト (Notionに列が存在する場合のみ)
    const finalWebsite = (website !== undefined ? website : place.website)?.trim();
    if (finalWebsite && propExists("公式サイト")) {
      properties["公式サイト"] = {
        url: finalWebsite,
      };
    }

    // ペット可 (Notionに列が存在する場合のみ)
    if (propExists("ペット可")) {
      properties["ペット可"] = {
        checkbox: finalPetsAllowed,
      };
    }

    // Google評価 (Notionに列が存在する場合のみ)
    if (typeof place.googleRating === "number" && propExists("Google評価")) {
      properties["Google評価"] = {
        number: place.googleRating,
      };
    }

    // クチコミ件数 (Notionに列が存在する場合のみ)
    if (typeof place.userRatingCount === "number" && propExists("クチコミ件数")) {
      properties["クチコミ件数"] = {
        number: place.userRatingCount,
      };
    }

    // 営業状況 (Notionに列が存在する場合のみ)
    if (propExists("営業状況")) {
      let statusName = "🟢 存続";
      if (place.businessStatus === "CLOSED_PERMANENTLY") {
        statusName = "🔴 閉業 (CLOSED)";
      } else if (place.businessStatus === "CLOSED_TEMPORARILY") {
        statusName = "🟡 一時休業";
      }
      properties["営業状況"] = {
        select: { name: statusName },
      };
    }

    // 店舗形態 (Notionに列が存在する場合のみ)
    if (propExists("店舗形態")) {
      const finalChain = chainType || place.chainType || "個人店・単独店";
      properties["店舗形態"] = {
        select: { name: finalChain },
      };
    }

    // 最新クチコミ日 (Notionに列が存在する場合のみ)
    if (place.latestReviewDate && propExists("最新クチコミ日")) {
      properties["最新クチコミ日"] = {
        date: { start: place.latestReviewDate },
      };
    }

    // 最終同期日 (Notionに列が存在する場合のみ)
    if (propExists("最終同期日")) {
      const todayJST = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(new Date())
        .replace(/\//g, "-");

      properties["最終同期日"] = {
        date: { start: todayJST },
      };
    }

    // Notion APIリクエスト
    const payload: any = {
      parent: { database_id: databaseId },
      properties,
      children,
    };

    if (resolvedPhotoUrl) {
      payload.cover = {
        type: "external",
        external: { url: resolvedPhotoUrl },
      };
    }

    // リトライループ（万一Notionエラーが返った場合、原因プロパティを自動除外・補正して再試行）
    let notionRes: Response | null = null;
    let maxRetries = 4;

    while (maxRetries > 0) {
      maxRetries--;
      notionRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (notionRes.ok) {
        break;
      }

      const errText = await notionRes.text();
      console.warn(`Notion page creation attempt failed (retries left: ${maxRetries}):`, errText);

      // ジャンルの型不一致エラー（multi_select <-> select）の自動補正
      if (errText.includes("ジャンル") && (errText.includes("select") || errText.includes("multi_select"))) {
        if (payload.properties["ジャンル"]?.multi_select) {
          payload.properties["ジャンル"] = { select: { name: primaryGenre } };
        } else {
          payload.properties["ジャンル"] = { multi_select: finalGenres.map((g) => ({ name: g })) };
        }
        continue;
      }

      // 「[プロパティ名] is not a property that exists」エラーを自動検出して除外
      const notFoundMatch = errText.match(/`?([^\s`]+)`?\s+is not a property that exists/i);
      if (notFoundMatch && notFoundMatch[1]) {
        const badProp = notFoundMatch[1];
        console.log(`Auto-removing non-existent property from payload: ${badProp}`);
        delete payload.properties[badProp];
        continue;
      }

      // その他のプロパティエラー（特定プロパティのバリデーション失敗）の自動除外
      let removedAny = false;
      for (const key of Object.keys(payload.properties)) {
        if (key !== "名前" && errText.includes(key)) {
          console.log(`Auto-removing failing property: ${key}`);
          delete payload.properties[key];
          removedAny = true;
          break;
        }
      }

      if (!removedAny) {
        // 原因プロパティが特定できない場合はループを終了
        break;
      }
    }

    if (!notionRes || !notionRes.ok) {
      const finalErrText = notionRes ? await notionRes.text() : "不明なエラー";
      console.error("Notion page creation error:", notionRes?.status, finalErrText);
      return NextResponse.json(
        { error: `Notion登録エラー (${notionRes?.status}): ${finalErrText}` },
        { status: notionRes?.status || 500 }
      );
    }

    const createdPage = await notionRes.json();
    const notionUrl =
      createdPage.url || `https://www.notion.so/${createdPage.id.replace(/-/g, "")}`;

    const chainKeywords = [
      "スターバックス", "starbucks", "コメダ珈琲", "コメダ", "ドトール", "doutor", "タリーズ", "tullys",
      "サンマルク", "saint marc", "星乃珈琲", "上島珈琲", "プロント", "pronto", "ブルーボトル", "blue bottle",
      "マクドナルド", "mcdonald", "モスバーガー", "mos burger", "ケンタッキー", "kfc",
      "サブウェイ", "subway", "バーガーキング", "burger king", "ロッテリア", "lotteria",
      "サイゼリヤ", "ガスト", "デニーズ", "ジョナサン", "ロイヤルホスト", "ココス", "cocos", "バーミヤン", "ジョリーパスタ",
      "大戸屋", "やよい軒", "まいどおおきに", "吉野家", "すき家", "松屋", "なか卯", "かつや", "松のや",
      "丸亀製麺", "はなまるうどん", "スシロー", "くら寿司", "はま寿司", "かっぱ寿司", "魚べい",
      "一蘭", "一風堂", "天下一品", "幸楽苑", "日高屋", "餃子の王将", "大阪王将", "リンガーハット",
      "鳥貴族", "串カツ田中", "牛角", "焼肉きんぐ", "安楽亭", "しゃぶ葉", "温野菜", "叙々苑",
      "ミスタードーナツ", "mister donut", "サーティワン", "baskin robbins", "スープストック", "soup stock",
      "coco壱番屋", "ココイチ", "銀だこ", "PRONTO", "椿屋珈琲", "倉式珈琲", "珈琲館"
    ];
    const isChain = chainKeywords.some((kw) => place.name.toLowerCase().includes(kw.toLowerCase()));

    const newPlace: Place = {
      id: createdPage.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      rating: rating || "",
      genre: primaryGenre,
      genres: finalGenres,
      openDays: place.openDays || [],
      timeSlots: place.timeSlots || [],
      isVegan: finalVegan.includes("ヴィーガン") || finalVegan.includes("ビーガン"),
      isAllVegan: finalVegan === "🌱 全てヴィーガン",
      isVegetarian: place.isVegetarian || finalVegan.includes("ヴィーガン"),
      isChain,
      parking: parkingItems,
      petsAllowed: finalPetsAllowed,
      coverUrl: resolvedPhotoUrl || undefined,
      mapsUrl: place.mapsUrl || undefined,
      websiteUrl: finalWebsite || undefined,
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
