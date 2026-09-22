"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Place } from "@/types/place";
import { PlacePopup } from "./PlacePopup";

interface MapProps {
  places: Place[];
  selectedPlaceId?: string | null;
  activeFilterGenres?: string[];
}

// ジャンル別のカラーパレット & ベクターアイコン定義 (Apple / Google Maps スタイル)
interface GenreStyle {
  topColor: string;
  bottomColor: string;
  iconSvg: string;
}

const getGenreStyle = (genre?: string, isVegan?: boolean): GenreStyle => {
  const g = genre || "";

  // 1. カフェ: くすみブルー (#718A91)
  if (g.includes("カフェ") || g.includes("喫茶") || g.includes("珈琲")) {
    return {
      topColor: "#718A91",
      bottomColor: "#52686E",
      iconSvg: `
        <image href="/coffee.png" x="1" y="1" width="14" height="14" preserveAspectRatio="xMidYMid meet" />
      `,
    };
  }

  // 1.5. パン屋: ダークブラウン (#78513F)
  if (g.includes("パン") || g.includes("ベーカリー")) {
    return {
      topColor: "#78513F",
      bottomColor: "#563829",
      iconSvg: `
        <path d="M2 9c0-3.5 2.5-6 6-6s6 2.5 6 6H2z" fill="currentColor"/>
        <path d="M4.5 5.5c.8-.8 1.8-1.2 3.5-1.2s2.7.4 3.5 1.2" stroke="#FFF" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
        <rect x="2" y="9.5" width="12" height="2" rx="1" fill="currentColor" opacity="0.8"/>
      `,
    };
  }

  // 1.8. 朝ごはん・モーニング: マスタードイエロー (#D2A84A)
  if (g.includes("朝ごはん") || g.includes("朝食") || g.includes("モーニング")) {
    return {
      topColor: "#D2A84A",
      bottomColor: "#A88230",
      iconSvg: `
        <circle cx="8" cy="8" r="4" fill="currentColor"/>
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      `,
    };
  }

  // 1.9. 昼ごはん・ランチ: テラコッタ (#C66F52)
  if (g.includes("昼ごはん") || g.includes("ランチ")) {
    return {
      topColor: "#C66F52",
      bottomColor: "#9E4F36",
      iconSvg: `
        <circle cx="8" cy="8" r="5.5" fill="currentColor" opacity="0.4"/>
        <path d="M5 4v3.5a1.5 1.5 0 001.5 1.5V13h1V9A1.5 1.5 0 009 7.5V4H7.8v2.5h-.6V4H6v2.5h-.6V4H5zm4.8 0v4h.8v5h1V4h-1.8z" fill="currentColor"/>
      `,
    };
  }

  // 1.95. 夜ごはん・夜ご飯・ディナー: オリーブグリーン (#7D8660)
  if (g.includes("夜ごはん") || g.includes("夜ご飯") || g.includes("ディナー")) {
    return {
      topColor: "#7D8660",
      bottomColor: "#5B6343",
      iconSvg: `
        <path d="M12 8a5 5 0 01-6.5-4.8 5 5 0 106.3 6.3A4.9 4.9 0 0112 8z" fill="currentColor"/>
        <circle cx="12" cy="3" r="0.8" fill="currentColor"/>
        <circle cx="4" cy="11" r="0.8" fill="currentColor"/>
      `,
    };
  }

  // 2. イタリアン・ピザ・パスタ: トスカーナワイン＆クリムゾンレッド
  if (g.includes("イタリアン") || g.includes("ピザ") || g.includes("パスタ") || g.includes("フレンチ")) {
    return {
      topColor: "#E11D48",
      bottomColor: "#9F1239",
      iconSvg: `
        <path d="M8 1C4.5 1 2.2 2.2 1 3c.6 1.8 7 14 7 14s6.4-12.2 7-14c-1.2-.8-3.5-2-7-2zm-3.5 3.2c1-.4 2.3-.7 3.5-.7s2.5.3 3.5.7l-3.5 7-3.5-7z" fill="currentColor"/>
        <circle cx="8" cy="6" r="1.1" fill="currentColor"/>
        <circle cx="6.2" cy="8.6" r="0.9" fill="currentColor"/>
        <circle cx="9.8" cy="8.6" r="0.9" fill="currentColor"/>
      `,
    };
  }

  // 3. ラーメン・つけ麺: サンセットオレンジ＆温かなスープ
  if (g.includes("ラーメン") || g.includes("拉麺") || g.includes("麺")) {
    return {
      topColor: "#EA580C",
      bottomColor: "#9A3412",
      iconSvg: `
        <path d="M2 7a6 6 0 0012 0H2z" fill="currentColor"/>
        <path d="M5 13.5h6v1.2H5vz" fill="currentColor"/>
        <path d="M1 5.5l14-2.5M1 7.2l14-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M4.5 1.5c.5.8-.5 1.5 0 2.2M8 1.5c.5.8-.5 1.5 0 2.2M11.5 1.5c.5.8-.5 1.5 0 2.2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
      `,
    };
  }

  // 4. 和食・寿司: 伝統の藍色＆オーシャンネイビー
  if (g.includes("和食") || g.includes("寿司") || g.includes("鮨") || g.includes("海鮮")) {
    return {
      topColor: "#2563EB",
      bottomColor: "#1E3A8A",
      iconSvg: `
        <rect x="2" y="7" width="12" height="6" rx="3" fill="currentColor" opacity="0.35"/>
        <path d="M1 7c0-2.5 3-4 7-4s7 1.5 7 4-3 2.5-7 2.5S1 9.5 1 7z" fill="currentColor"/>
        <rect x="7" y="4" width="2" height="9" fill="currentColor"/>
      `,
    };
  }

  // 5. 居酒屋・バー: ロイヤルバイオレット＆カクテルパープル
  if (g.includes("居酒屋") || g.includes("バー") || g.includes("酒")) {
    return {
      topColor: "#8B5CF6",
      bottomColor: "#5B21B6",
      iconSvg: `
        <path d="M3 3h10l-4 6v4h3v2H4v-2h3V9L3 3zm2.5 2l2.5 3.8L10.5 5h-5z" fill="currentColor"/>
        <circle cx="11.5" cy="2" r="1.3" fill="currentColor"/>
      `,
    };
  }

  // 6. 焼肉・ステーキ: 熟成ルビー＆チャコールレッド
  if (g.includes("焼肉") || g.includes("ステーキ") || g.includes("肉")) {
    return {
      topColor: "#DC2626",
      bottomColor: "#7F1D1D",
      iconSvg: `
        <path d="M8 1c.5 1.5-.5 2.5 0 4 1.5-1 2-2 2-2s1 2.5.5 4c1-.5 1.5-1.5 1.5-1.5s.5 2-.5 3.5C10 11 9 12 8 12s-3-1-3.5-3c-1 1.5-.5 3.5-.5 3.5s-.5-2 .5-4c0 0 .5 1 1.5 1.5-.5-1.5 0-4 .5-4s-.5 1 0 2c.5-1.5 1-2.5 1-3.5z" fill="currentColor"/>
        <rect x="3" y="13" width="10" height="2" rx="1" fill="currentColor"/>
      `,
    };
  }

  // 7. 中華・点心: ウォームコーラル
  if (g.includes("中華") || g.includes("餃子") || g.includes("飲茶")) {
    return {
      topColor: "#F43F5E",
      bottomColor: "#BE123C",
      iconSvg: `
        <path d="M8 2C4.5 2 2 4.5 2 7c0 3 2.5 5 6 5s6-2 6-5c0-2.5-2.5-5-6-5zm0 1.5c1.5 0 3 .8 3.5 2h-7C5 4.3 6.5 3.5 8 3.5z" fill="currentColor"/>
        <path d="M1 13h14v2H1z" fill="currentColor" opacity="0.6"/>
      `,
    };
  }

  // 8. ジャンル自体がヴィーガン / 自然食の場合、またはジャンル不明でヴィーガン対応の場合
  if (g.includes("ヴィーガン") || g.includes("ビーガン") || g.includes("自然食") || (isVegan && (!g || g === "その他"))) {
    return {
      topColor: "#10B981",
      bottomColor: "#047857",
      iconSvg: `
        <path d="M14 2C9 2 5 6 5 11c0 2 .5 3.5 1.5 4.5C5.5 14.5 2 11 2 7c0 0 0-3 3-4 0 0-3 5 0 9 0 0 2-4 7-6 1.5-.6 2-4 2-4z" fill="currentColor"/>
        <path d="M14 2c-1 4-3 7-7.5 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      `,
    };
  }

  // デフォルト / その他: モダンインディゴ & スプーンフォーク
  return {
    topColor: "#4F46E5",
    bottomColor: "#312E81",
    iconSvg: `
      <path d="M4 1v4a2 2 0 002 2v8h2V7a2 2 0 002-2V1H9v3H7V1H4zm7 0c-1.5 0-2.5 1.5-2.5 3.5S9.5 8 11 8v7h2V1h-2z" fill="currentColor"/>
    `,
  };
};

// スタイリッシュなSVGティアドロップピンの生成
const createCustomPin = (
  place: Place,
  isSelected: boolean,
  activeFilterGenres?: string[]
) => {
  // 案1（代表ジャンル表示）＋ 案2（フィルター連動）
  let targetGenre = place.genre || "その他";

  if (activeFilterGenres && activeFilterGenres.length > 0 && place.genres && place.genres.length > 0) {
    // フィルターで選択中のジャンルに合致するものがあれば、そのジャンル色に変身！
    const matched = activeFilterGenres.find((afg) =>
      place.genres?.some((pg) => {
        if (pg === afg) return true;
        if (afg === "昼ごはん") {
          return ["昼ごはん", "イタリアン", "パスタ", "ピザ", "フレンチ", "洋食", "ランチ"].includes(pg);
        }
        if (afg === "夜ごはん" || afg === "夜ご飯") {
          return ["夜ごはん", "夜ご飯", "ラーメン", "和食", "居酒屋", "焼肉", "中華", "寿司", "ディナー"].includes(pg);
        }
        if (afg === "パン屋") return ["パン屋", "ベーカリー", "パン"].includes(pg);
        if (afg === "朝ごはん") return ["朝ごはん", "モーニング", "朝食"].includes(pg);
        if (afg === "カフェ") return ["カフェ", "喫茶", "珈琲", "スイーツ"].includes(pg);
        return false;
      })
    );
    if (matched) {
      targetGenre = matched;
    } else {
      targetGenre = place.genres[0] || place.genre || "その他";
    }
  } else if (place.genres && place.genres.length > 0) {
    targetGenre = place.genres[0]; // 案1: 代表ジャンル
  }

  const style = getGenreStyle(targetGenre, place.isVegan);
  const pinId = `pin-${place.id.replace(/[^a-zA-Z0-9]/g, "")}`;

  const transformClass = isSelected
    ? "scale-125 -translate-y-1 filter drop-shadow-xl z-50 animate-bounce duration-1000"
    : "hover:scale-115 hover:-translate-y-1 transition-all duration-200";

  const pulseRing = isSelected
    ? `<circle cx="19" cy="18" r="18" stroke="${style.topColor}" stroke-width="3" stroke-opacity="0.6" fill="none" class="animate-ping"/>`
    : "";

  const veganBadge = place.isVegan
    ? `
      <!-- ヴィーガン対応バッジ（右肩の小さなグリーンリーフ） -->
      <g transform="translate(24, 0)">
        <circle cx="6" cy="6" r="5.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5"/>
        <path d="M8.5 3.5C6.5 3.5 5 4.8 5 6.8c0 .8.2 1.4.6 1.8-.4-.4-.6-1-.6-1.8 0 0 0-1.2 1.2-1.6 0 0-1.2 1.6 0 2.8 0 0 .8-1.2 2.3-1.8.6-.2.8-1.2.8-1.2z" fill="#FFFFFF"/>
      </g>
    `
    : "";

  const svgHtml = `
    <div class="relative flex items-center justify-center cursor-pointer ${transformClass}">
      <svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="filter drop-shadow-md">
        <defs>
          <linearGradient id="grad-${pinId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${style.topColor}"/>
            <stop offset="100%" stop-color="${style.bottomColor}"/>
          </linearGradient>
        </defs>

        ${pulseRing}

        <!-- 外枠ティアドロップシェイプ -->
        <path
          d="M19 0C8.50659 0 0 8.50659 0 19C0 30.5 15 44.5 18.2 47.3C18.7 47.7 19.3 47.7 19.8 47.3C23 44.5 38 30.5 38 19C38 8.50659 29.4934 0 19 0Z"
          fill="url(#grad-${pinId})"
        />

        <!-- 白抜きインナーサークル -->
        <circle cx="19" cy="18" r="12" fill="#FFFFFF" class="shadow-inner"/>

        <!-- ジャンル別ベクターシルエットアイコン -->
        <g transform="translate(11, 10)" style="color: ${style.topColor}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            ${style.iconSvg}
          </svg>
        </g>

        ${veganBadge}
      </svg>
    </div>
  `;

  return L.divIcon({
    className: "!bg-transparent !border-0",
    html: svgHtml,
    iconSize: [38, 48],
    iconAnchor: [19, 48],
    popupAnchor: [0, -48],
  });
};

// フィルター変更または店舗選択時に地図の表示範囲・中心を自動調整する補助コンポーネント
const MapAutoBounds: React.FC<{ places: Place[]; selectedPlaceId?: string | null }> = ({
  places,
  selectedPlaceId,
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedPlaceId) {
      const target = places.find((p) => p.id === selectedPlaceId);
      if (target?.latitude && target?.longitude) {
        map.flyTo([target.latitude, target.longitude], 16, { duration: 1.0 });
        return;
      }
    }

    if (places.length === 0) return;

    if (places.length === 1 && places[0].latitude && places[0].longitude) {
      map.flyTo([places[0].latitude, places[0].longitude], 15, {
        duration: 0.8,
      });
      return;
    }

    const validCoords = places
      .filter((p) => p.latitude !== null && p.longitude !== null)
      .map((p) => [p.latitude!, p.longitude!] as [number, number]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 16,
      });
    }
  }, [places, selectedPlaceId, map]);

  return null;
};

export const Map: React.FC<MapProps> = ({
  places,
  selectedPlaceId,
  activeFilterGenres,
}) => {
  // 初期表示の中心座標（東京中心、または店舗があれば最初の店舗）
  const validPlaces = places.filter(
    (p) => p.latitude !== null && p.longitude !== null
  );

  const defaultCenter: [number, number] =
    validPlaces.length > 0
      ? [validPlaces[0].latitude!, validPlaces[0].longitude!]
      : [35.681236, 139.767125]; // 東京駅

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapAutoBounds places={validPlaces} selectedPlaceId={selectedPlaceId} />

        {validPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude!, place.longitude!]}
            icon={createCustomPin(
              place,
              place.id === selectedPlaceId,
              activeFilterGenres
            )}
          >
            <Popup className="custom-leaflet-popup" closeButton={true}>
              <PlacePopup place={place} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;
