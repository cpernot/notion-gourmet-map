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
}

// ジャンル別アイコン絵文字の定義
const getGenreIcon = (genre?: string) => {
  if (!genre) return "📍";
  if (genre.includes("カフェ") || genre.includes("喫茶") || genre.includes("珈琲")) return "☕";
  if (genre.includes("ラーメン")) return "🍜";
  if (genre.includes("イタリアン") || genre.includes("ピザ") || genre.includes("パスタ")) return "🍕";
  if (genre.includes("居酒屋") || genre.includes("バー")) return "🍺";
  if (genre.includes("和食") || genre.includes("寿司")) return "🍣";
  if (genre.includes("中華") || genre.includes("餃子")) return "🥟";
  if (genre.includes("焼肉") || genre.includes("ステーキ")) return "🥩";
  return "🍴";
};

// スタイリッシュなピン用 DivIcon の生成
const createCustomPin = (place: Place, isSelected: boolean) => {
  const emoji = getGenreIcon(place.genre);
  const bgColor = place.isVegan ? "bg-emerald-600" : isSelected ? "bg-rose-600" : "bg-blue-600";
  const ring = isSelected ? "ring-4 ring-rose-400/50 scale-125" : "ring-2 ring-white shadow-lg";

  return L.divIcon({
    className: "!bg-transparent !border-0",
    html: `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110">
        <div class="flex items-center justify-center w-8 h-8 rounded-full ${bgColor} ${ring} text-white shadow-md">
          <span class="text-sm leading-none">${emoji}</span>
        </div>
        <div class="absolute -bottom-1 w-2 h-2 ${bgColor} rotate-45"></div>
      </div>
    `,
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36],
  });
};

// フィルター変更時に地図の表示範囲（Bounds）を自動調整する補助コンポーネント
const MapAutoBounds: React.FC<{ places: Place[] }> = ({ places }) => {
  const map = useMap();

  useEffect(() => {
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
  }, [places, map]);

  return null;
};

export const Map: React.FC<MapProps> = ({ places, selectedPlaceId }) => {
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

        <MapAutoBounds places={validPlaces} />

        {validPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude!, place.longitude!]}
            icon={createCustomPin(place, place.id === selectedPlaceId)}
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
