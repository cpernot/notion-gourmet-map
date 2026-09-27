"use client";

import React from "react";
import { Place } from "@/types/place";
import { ExternalLink, MapPin, Clock, Star, Car, Leaf, Globe, Utensils } from "lucide-react";

interface PlacePopupProps {
  place: Place;
}

export const PlacePopup: React.FC<PlacePopupProps> = ({ place }) => {
  const displayGenres =
    place.genres && place.genres.length > 0
      ? place.genres
      : place.genre
      ? [place.genre]
      : [];

  return (
    <div className="w-72 max-w-[85vw] font-sans text-gray-800 p-1">
      {/* サムネイル画像 */}
      {place.coverUrl ? (
        <div className="relative w-full h-36 rounded-lg overflow-hidden mb-2.5 bg-gray-100 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={place.coverUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {displayGenres.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[90%]">
              {displayGenres.map((g) => (
                <span
                  key={g}
                  className="bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        displayGenres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {displayGenres.map((g) => (
              <span
                key={g}
                className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200"
              >
                {g}
              </span>
            ))}
          </div>
        )
      )}

      {/* 店名 & 評価 */}
      <div className="flex items-start justify-between gap-1 mb-1">
        <h3 className="font-bold text-base text-gray-900 leading-snug line-clamp-2">
          {place.name}
        </h3>
        {place.rating && !place.rating.includes("未") ? (
          <span className="flex items-center text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
            <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
            {place.rating}
          </span>
        ) : (
          <span className="flex items-center text-[11px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
            <Star className="w-3 h-3 text-gray-400 mr-0.5" />
            未訪問 (★0)
          </span>
        )}
      </div>

      {/* 住所 */}
      {place.address && (
        <div className="flex items-center text-xs text-gray-500 mb-2 leading-tight">
          <MapPin className="w-3 h-3 text-gray-400 mr-1 shrink-0" />
          <span className="truncate">{place.address}</span>
        </div>
      )}

      {/* タグ情報（バッジ一覧） */}
      <div className="flex flex-wrap gap-1 mb-3">
        {/* 料理ジャンル (未登録・空なら自動スキップ) */}
        {place.cuisineGenres &&
          place.cuisineGenres.map((cg) => (
            <span
              key={cg}
              className="inline-flex items-center text-[11px] font-semibold bg-orange-50 text-orange-800 border border-orange-200 px-1.5 py-0.5 rounded"
            >
              <Utensils className="w-2.5 h-2.5 mr-1 text-orange-600" />
              {cg}
            </span>
          ))}

        {/* ヴィーガン / ベジタリアン */}
        {place.isAllVegan ? (
          <span className="inline-flex items-center text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded">
            <Leaf className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
            全てヴィーガン
          </span>
        ) : place.isVegan ? (
          <span className="inline-flex items-center text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
            <Leaf className="w-2.5 h-2.5 mr-0.5" />
            ヴィーガン対応
          </span>
        ) : place.isVegetarian ? (
          <span className="inline-flex items-center text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
            <Leaf className="w-2.5 h-2.5 mr-0.5" />
            ベジタリアン
          </span>
        ) : null}

        {/* 駐車場 */}
        {place.parking.length > 0 && (
          <span className="inline-flex items-center text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
            <Car className="w-2.5 h-2.5 mr-0.5" />
            {place.parking[0]}
          </span>
        )}

        {/* 営業曜日 */}
        {place.openDays.length > 0 && (
          <span className="inline-flex items-center text-[11px] font-medium bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
            {place.openDays.length === 7 ? "年中無休" : place.openDays.join("・")}
          </span>
        )}

        {/* 時間帯 */}
        {place.timeSlots.map((slot) => (
          <span
            key={slot}
            className="inline-flex items-center text-[10px] font-medium bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-100"
          >
            {slot}
          </span>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
        {place.websiteUrl && (
          <a
            href={place.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm active:scale-95"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>公式サイトを見る</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <a
            href={place.notionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors shadow-sm active:scale-95"
          >
            <span>Notion</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {place.mapsUrl && (
            <a
              href={place.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-2 bg-white text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors active:scale-95"
            >
              <span>Googleマップ</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
