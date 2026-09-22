"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Place, FilterState } from "@/types/place";
import { FilterBar } from "@/components/FilterBar";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import { Loader2, AlertCircle, RefreshCw, Plus, CheckCircle2, ShieldCheck, LogOut } from "lucide-react";

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

  // 管理者モード管理（方式 1: シークレットURL ?admin=KEY）
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    ratings: [],
    days: [],
    timeSlots: [],
    chainOnly: false,
    openNow: false,
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

    // 管理者キーの判定・検証
    const checkAdminStatus = async () => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const urlAdminKey = params.get("admin");

      // ログアウト指示 ?admin=logout
      if (urlAdminKey === "logout") {
        localStorage.removeItem("mogu_admin_key");
        setIsAdmin(false);
        setAdminKey(null);
        window.history.replaceState({}, "", window.location.pathname);
        setToastMessage("管理者モードを解除しました");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      // URL指定がある場合、検証して保存
      const candidateKey = urlAdminKey || localStorage.getItem("mogu_admin_key");
      if (!candidateKey) return;

      try {
        const res = await fetch(`/api/auth/verify?key=${encodeURIComponent(candidateKey)}`);
        const data = await res.json().catch(() => ({ valid: false }));

        if (data.valid) {
          setIsAdmin(true);
          setAdminKey(candidateKey);
          localStorage.setItem("mogu_admin_key", candidateKey);

          // URLパラメータを非表示にしてURLをスッキリさせる
          if (urlAdminKey) {
            window.history.replaceState({}, "", window.location.pathname);
            setToastMessage("管理者モードで認証されました（店舗登録が可能です）");
            setTimeout(() => setToastMessage(null), 4000);
          }
        } else if (urlAdminKey) {
          setToastMessage("管理者キーが無効です");
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          // 保存キーが無効化された場合
          localStorage.removeItem("mogu_admin_key");
          setIsAdmin(false);
          setAdminKey(null);
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      }
    };

    checkAdminStatus();
  }, []);

  const handleLogoutAdmin = () => {
    localStorage.removeItem("mogu_admin_key");
    setIsAdmin(false);
    setAdminKey(null);
    setToastMessage("管理者モードを解除しました");
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  // 基本ジャンル（朝ごはん, 昼ごはん, 夜ごはん, パン屋, カフェ）を常に表示
  const availableGenres = useMemo(() => {
    const defaultList = ["朝ごはん", "昼ごはん", "夜ごはん", "パン屋", "カフェ"];
    const extraGenres = new Set<string>();
    places.forEach((p) => {
      if (p.genre && p.genre.trim() && !defaultList.includes(p.genre.trim())) {
        // 既存の旧ジャンル（イタリアン、ラーメン等）は新ジャンルに包括されるため除外するか、その他のみ追加
        if (p.genre === "その他") {
          extraGenres.add("その他");
        }
      }
    });
    return [...defaultList, ...Array.from(extraGenres)];
  }, [places]);

  // 旧ジャンルから新ジャンルへの包括判定マップ
  const genreMatches = (placeGenre: string = "", filterGenre: string): boolean => {
    if (placeGenre === filterGenre) return true;
    if (filterGenre === "昼ごはん") {
      return ["昼ごはん", "イタリアン", "パスタ", "ピザ", "フレンチ", "洋食", "ランチ"].includes(placeGenre);
    }
    if (filterGenre === "夜ごはん") {
      return ["夜ごはん", "ラーメン", "和食", "居酒屋", "焼肉", "中華", "寿司", "ディナー"].includes(placeGenre);
    }
    if (filterGenre === "パン屋") {
      return ["パン屋", "ベーカリー", "パン"].includes(placeGenre);
    }
    if (filterGenre === "朝ごはん") {
      return ["朝ごはん", "モーニング", "朝食"].includes(placeGenre);
    }
    if (filterGenre === "カフェ") {
      return ["カフェ", "喫茶", "スイーツ"].includes(placeGenre);
    }
    return false;
  };

  // フィルター処理
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      // ① ジャンルフィルター (複数選択: 店舗が持つジャンルのいずれかとマッチすればOK)
      if (filters.genres.length > 0) {
        const placeGenres =
          place.genres && place.genres.length > 0
            ? place.genres
            : place.genre
            ? [place.genre]
            : [];
        const matches = filters.genres.some((fg) =>
          placeGenres.some((pg) => genreMatches(pg, fg))
        );
        if (!matches) {
          return false;
        }
      }

      // ② 評価フィルター (複数選択: いずれかに該当すればOK)
      if (filters.ratings.length > 0) {
        const ratingMatch = place.rating?.match(/(\d+(\.\d+)?)/);
        const placeStars = ratingMatch ? parseFloat(ratingMatch[0]) : 0;
        const matchesAnyRating = filters.ratings.some((r) => {
          const target = parseInt(r, 10);
          if (target === 5) return placeStars >= 4.8;
          if (target === 4) return placeStars >= 3.8 && placeStars < 4.8;
          if (target === 3) return placeStars >= 2.8 && placeStars < 3.8;
          if (target === 2) return placeStars >= 1.8 && placeStars < 2.8;
          if (target === 1) return placeStars < 1.8;
          return false;
        });
        if (!matchesAnyRating) return false;
      }

      // ③ 営業曜日フィルター (複数選択: 選択された曜日のいずれかに営業していればOK)
      if (filters.days.length > 0) {
        if (place.openDays.length > 0) {
          const hasMatchingDay = filters.days.some((d) => place.openDays.includes(d));
          if (!hasMatchingDay) return false;
        }
      }

      // ④ 時間帯フィルター (複数選択: 選択された時間帯のいずれかに営業していればOK)
      if (filters.timeSlots.length > 0) {
        if (place.timeSlots.length > 0) {
          const hasMatchingSlot = filters.timeSlots.some((ts) => place.timeSlots.includes(ts));
          if (!hasMatchingSlot) return false;
        }
      }

      // ⑤ 営業中フィルター（今の日時で絞る）
      if (filters.openNow) {
        // 日本時間（JST）の現在曜日と時刻を取得
        const now = new Date();
        const jstDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
        const dayMap = ["日", "月", "火", "水", "木", "金", "土"];
        const currentDay = dayMap[jstDate.getDay()];
        const currentHour = jstDate.getHours() + jstDate.getMinutes() / 60;

        // 1. 曜日チェック（定休日かどうか）
        if (place.openDays.length > 0 && !place.openDays.includes(currentDay)) {
          return false;
        }

        // 2. 開店・閉店時間チェック
        if (typeof place.closeHour === "number") {
          const openH = place.openHour ?? 0;
          const closeH = place.closeHour;

          if (closeH <= 5) {
            // 深夜営業（例: 翌2時閉店）
            const isLateNightOpen = currentHour >= (openH || 17) || currentHour < closeH;
            if (!isLateNightOpen) return false;
          } else {
            // 通常営業（例: 11時〜22時）
            if (currentHour < openH || currentHour >= closeH) {
              return false;
            }
          }
        } else if (place.timeSlots.length > 0) {
          // 時間帯による判定（現在時刻に対応する時間帯が登録されているか）
          let currentSlot = "";
          if (currentHour < 10) currentSlot = "🌅 朝";
          else if (currentHour < 12) currentSlot = "🥐 モーニング";
          else if (currentHour < 14.5) currentSlot = "☀️ ランチ";
          else if (currentHour < 17.5) currentSlot = "☕ カフェ";
          else if (currentHour < 22) currentSlot = "🌙 ディナー";
          else currentSlot = "🌃 深夜営業";

          if (!place.timeSlots.includes(currentSlot)) {
            return false;
          }
        }
      }

      // ⑥ チェーン店フィルター
      if (filters.chainOnly && !place.isChain) {
        return false;
      }

      // ⑦ 駐車場あり限定
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
      <MapComponent
        places={filteredPlaces}
        selectedPlaceId={selectedPlaceId}
        activeFilterGenres={filters.genres}
      />

      {/* 管理者専用: フローティング「+ 店舗を登録」ボタン & 管理者バッジ */}
      {isAdmin && (
        <div className="absolute bottom-6 right-5 sm:right-6 z-[1000] flex flex-col items-end gap-2">
          {/* 管理者モードインジケーター */}
          <div className="flex items-center gap-1.5 bg-gray-900/85 backdrop-blur-md border border-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-medium shadow-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>管理者モード</span>
            <button
              type="button"
              onClick={handleLogoutAdmin}
              title="管理者モードを解除"
              className="ml-1 text-gray-400 hover:text-rose-400 transition-colors p-0.5"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-3 rounded-full shadow-2xl shadow-blue-500/40 border border-white/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>店舗を登録</span>
          </button>
        </div>
      )}

      {/* 店舗登録モーダル */}
      <AddPlaceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPlaceAdded={handlePlaceAdded}
        availableGenres={availableGenres}
        adminKey={adminKey}
      />
    </main>
  );
}
