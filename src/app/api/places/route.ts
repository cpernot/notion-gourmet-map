import { NextResponse } from "next/server";
import { Place } from "@/types/place";
import { extractCoordsFromUrl, geocodeAddress } from "@/utils/geocoding";

export const dynamic = "force-dynamic";

export async function GET() {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !databaseId) {
    return NextResponse.json(
      { error: "NOTION_TOKEN または NOTION_DATABASE_ID が設定されていません。" },
      { status: 500 }
    );
  }

  try {
    const places: Place[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;

    while (hasMore) {
      const bodyPayload: {
        page_size: number;
        start_cursor?: string;
        filter: { property: string; title: { is_not_empty: boolean } };
      } = {
        page_size: 100,
        filter: {
          property: "名前",
          title: {
            is_not_empty: true,
          },
        },
      };

      if (cursor) {
        bodyPayload.start_cursor = cursor;
      }

      const res = await fetch(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notionToken}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyPayload),
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Notion API error:", res.status, errText);
        throw new Error(`Notion API error: ${res.status}`);
      }

      const response = await res.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const page of response.results as any[]) {
        const props = page.properties || {};

        // 1. 店名
        const name = props["名前"]?.title?.[0]?.plain_text || "名称未設定";

        // 2. 住所
        const address =
          props["住所"]?.rich_text?.[0]?.plain_text ||
          props["エリア / 最寄駅"]?.rich_text?.[0]?.plain_text ||
          "";

        // 3. マップURL
        const mapsUrl = props["マップ"]?.url || "";

        // 4. 緯度・経度 (Latitude/Longitude または 緯度/経度, rich_text または number に対応)
        let latitude: number | null = null;
        let longitude: number | null = null;

        const latProp = props["Latitude"] || props["緯度"] || props["latitude"];
        if (latProp?.number !== undefined && latProp?.number !== null) {
          latitude = latProp.number;
        } else if (latProp?.rich_text?.[0]?.plain_text) {
          const parsed = parseFloat(latProp.rich_text[0].plain_text);
          if (!isNaN(parsed)) latitude = parsed;
        }

        const lngProp = props["Longitude"] || props["経度"] || props["longitude"];
        if (lngProp?.number !== undefined && lngProp?.number !== null) {
          longitude = lngProp.number;
        } else if (lngProp?.rich_text?.[0]?.plain_text) {
          const parsed = parseFloat(lngProp.rich_text[0].plain_text);
          if (!isNaN(parsed)) longitude = parsed;
        }

        if (latitude === null || longitude === null) {
          // URLからの抽出を試みる
          const fromUrl = extractCoordsFromUrl(mapsUrl);
          if (fromUrl) {
            latitude = fromUrl.lat;
            longitude = fromUrl.lng;
          } else if (address) {
            // 国土地理院/Nominatimジオコーディングを試みる
            const fromAddr = await geocodeAddress(address);
            if (fromAddr) {
              latitude = fromAddr.lat;
              longitude = fromAddr.lng;
            }
          }
        }

        // 5. 評価
        const rating = props["評価"]?.select?.name || "";

        // 6. ジャンル (multi_select または select の両方に対応、空白を自動トリム)
        let genres: string[] = [];
        if (props["ジャンル"]?.multi_select) {
          genres = props["ジャンル"].multi_select
            .map((o: { name: string }) => o.name?.trim())
            .filter(Boolean);
        } else if (props["ジャンル"]?.select?.name) {
          genres = [props["ジャンル"].select.name.trim()];
        }
        if (genres.length === 0) {
          genres = ["その他"];
        }
        const genre = genres[0] || "その他";

        // 7. 営業曜日
        const openDays: string[] =
          props["営業曜日"]?.multi_select?.map((o: { name: string }) => o.name) || [];

        // 8. 時間帯
        const timeSlots: string[] =
          props["時間帯"]?.multi_select?.map((o: { name: string }) => o.name) || [];

        // 9. 開店・閉店時間
        const openHour = props["開店時間"]?.number ?? undefined;
        const closeHour = props["閉店時間"]?.number ?? undefined;

        // 10. 食事対応 / ビーガン・ベジタリアン
        const dietaryList: string[] = [
          ...(props["食事対応"]?.multi_select?.map((o: { name: string }) => o.name) || []),
          ...(props["ヴィーガン・ベジタリアン"]?.multi_select?.map((o: { name: string }) => o.name) || []),
        ];
        const veganSelectName =
          props["ヴィーガン・ベジタリアン"]?.select?.name ||
          props["ビーガン・ベジタリアン"]?.select?.name ||
          props["食事対応"]?.select?.name ||
          "";
        if (veganSelectName) {
          dietaryList.push(veganSelectName);
        }

        const isVeganCheckbox =
          props["ビーガン対応"]?.checkbox ??
          props["ヴィーガン対応"]?.checkbox ??
          props["ヴィーガン"]?.checkbox ??
          props["ビーガン"]?.checkbox ??
          false;

        const isVegan =
          isVeganCheckbox ||
          dietaryList.some(
            (d) =>
              (d.includes("ビーガン") || d.includes("ヴィーガン") || d.toLowerCase().includes("vegan")) &&
              !d.includes("非対応") &&
              !d.includes("不明") &&
              !d.includes("なし")
          );

        const isVegetarian =
          isVegan ||
          dietaryList.some(
            (d) =>
              (d.includes("ベジタリアン") || d.toLowerCase().includes("vegetarian")) &&
              !d.includes("非対応") &&
              !d.includes("不明") &&
              !d.includes("なし")
          );

        // 10.5. チェーン店判定
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

        const isChainProp =
          Boolean(props["チェーン店"]?.checkbox) ||
          Boolean(props["チェーン"]?.checkbox) ||
          Boolean(props["チェーン店"]?.select?.name?.includes("チェーン")) ||
          Boolean(props["チェーン"]?.select?.name?.includes("チェーン")) ||
          Boolean(props["タイプ"]?.select?.name?.includes("チェーン"));

        const lowerName = name.toLowerCase();
        const isChainKeyword = chainKeywords.some((kw) => lowerName.includes(kw.toLowerCase()));

        const isChain = isChainProp || isChainKeyword;

        // 11. 駐車場
        let parking: string[] = [];
        if (props["駐車場"]?.multi_select) {
          parking = props["駐車場"].multi_select.map((o: { name: string }) => o.name);
        } else if (props["駐車場"]?.select?.name) {
          parking = [props["駐車場"].select.name];
        }

        // 12. カバー写真
        let coverUrl: string | undefined = undefined;
        if (page.cover) {
          coverUrl = page.cover.external?.url || page.cover.file?.url;
        }
        if (!coverUrl && props["photo_url"]?.files?.[0]) {
          coverUrl =
            props["photo_url"].files[0].external?.url ||
            props["photo_url"].files[0].file?.url;
        }
        if (!coverUrl && props["カバー画像"]?.files?.[0]) {
          coverUrl =
            props["カバー画像"].files[0].external?.url ||
            props["カバー画像"].files[0].file?.url;
        }

        // 13. NotionページURL
        const notionUrl = page.url || `https://www.notion.so/${page.id.replace(/-/g, "")}`;

        places.push({
          id: page.id,
          name,
          address,
          latitude,
          longitude,
          rating,
          genre,
          genres,
          openDays,
          timeSlots,
          openHour,
          closeHour,
          isVegan,
          isVegetarian,
          isChain,
          parking,
          coverUrl,
          mapsUrl,
          notionUrl,
        });
      }

      hasMore = response.has_more;
      cursor = response.next_cursor ?? undefined;
    }

    return NextResponse.json({ places, count: places.length });
  } catch (error) {
    console.error("Notion API query error:", error);
    return NextResponse.json(
      { error: "Notionデータベースの取得に失敗しました。" },
      { status: 500 }
    );
  }
}
