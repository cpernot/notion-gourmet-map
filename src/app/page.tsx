"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Place, FilterState } from "@/types/place";
import { FilterBar } from "@/components/FilterBar";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import { Loader2, AlertCircle, RefreshCw, Plus, CheckCircle2 } from "lucide-react";

// LeafletはSSRでエラーになるため、next/dynamicで動的インポート
const MapComponent = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
      <p className="text-xs text-gray-500 font-medium">地図を初期化中...</p>
    </div>
  ),
});

export default function HomePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // 店舗登録モーダルとトースト状態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    genre: "all",
    rating: "all",
    day: "all",
    timeSlot: "all",
    veganOnly: false,
    parkingOnly: false,
  });

  const fetchPlaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/places");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error: ${res.status}`);
      }
      const data = await res.json();
      setPlaces(data.places || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "店舗情報の取得に失敗しました。";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  // 新規店舗が登録されたときのハンドラー
  const handlePlaceAdded = (newPlace: Place) => {
    setPlaces((prev) => [newPlace, ...prev]);
    setSelectedPlaceId(newPlace.id);

    // トースト通知を表示（4秒間）
    setToastMessage(`「${newPlace.name}」をNotionに登録しました！`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 登録店舗からユニークなジャンル一覧を抽出
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    places.forEach((p) => {
      if (p.genre && p.genre.trim()) {
        genreSet.add(p.genre.trim());
      }
    });
    return Array.from(genreSet).sort();
  }, [places]);

  // フィルター処理
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      // ① ジャンルフィルター
      if (filters.genre !== "all") {
        if (!place.genre || place.genre !== filters.genre) {
          return false;
        }
      }

      // ② 評価フィルター (★5のみ / ★4以上 / ★3以上)
      if (filters.rating !== "all") {
        const targetRating = parseInt(filters.rating, 10);
        // "★4" や "4.5" などから数値を抽出
        const ratingMatch = place.rating?.match(/(\d+(\.\d+)?)/);
        const placeStars = ratingMatch ? parseFloat(ratingMatch[0]) : 0;

        if (targetRating === 5) {
          if (placeStars < 4.8) return false;
        } else if (targetRating === 4) {
          if (placeStars < 3.8) return false;
        } else if (targetRating === 3) {
          if (placeStars < 2.8) return false;
        }
      }

      // ③ 営業曜日フィルター
      if (filters.day !== "all") {
        if (place.openDays.length > 0 && !place.openDays.includes(filters.day)) {
          return false;
        }
      }

      // ④ 時間帯フィルター
      if (filters.timeSlot !== "all") {
        if (place.timeSlots.length > 0 && !place.timeSlots.includes(filters.timeSlot)) {
          return false;
        }
      }

      // ⑤ ヴィーガン限定
      if (filters.veganOnly && !place.isVegan) {
        return false;
      }

      // ⑥ 駐車場あり限定
      if (filters.parkingOnly) {
        const hasParking = place.parking.some(
          (p) => p.includes("あり") || p.includes("無料") || p.includes("有料")
        );
        if (!hasParking) return false;
      }

      return true;
    });
  }, [places, filters]);

  return (
    <main className="relative w-full h-dvh overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* フローティングフィルターバー */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        count={filteredPlaces.length}
        total={places.length}
        availableGenres={availableGenres}
      />

      {/* エラー表示バナー */}
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-md bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchPlaces}
            className="flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100 px-2 py-1 rounded-lg"
          >
            <RefreshCw className="w-3 h-3" />
            <span>再試行</span>
          </button>
        </div>
      )}

      {/* トースト通知バナー */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1500] w-11/12 max-w-md bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
          <span className="text-xs font-bold leading-tight">{toastMessage}</span>
        </div>
      )}

      {/* 初期ロード中オーバーレイ */}
      {isLoading && places.length === 0 && (
        <div className="absolute inset-0 z-[1001] bg-white/70 dark:bg-gray-950/70 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-white dark:bg-gray-900 px-6 py-5 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2.5" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Notionから店舗データを読み込み中...
            </p>
            <p className="text-xs text-gray-400 mt-1">少々お待ちください</p>
          </div>
        </div>
      )}

      {/* 地図本体 */}
      <MapComponent places={filteredPlaces} selectedPlaceId={selectedPlaceId} />

      {/* フローティング「+ 店舗を追加」ボタン (FAB) */}
      <div className="absolute bottom-6 right-5 sm:right-6 z-[1000]">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-3 rounded-full shadow-2xl shadow-blue-500/40 border border-white/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>店舗を登録</span>
        </button>
      </div>

      {/* 店舗登録モーダル */}
      <AddPlaceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPlaceAdded={handlePlaceAdded}
        availableGenres={availableGenres}
      />
    </main>
  );
}
