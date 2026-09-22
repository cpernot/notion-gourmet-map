"use client";

import React, { useState } from "react";
import { GooglePlaceSearchResult } from "@/utils/googlePlaces";
import { Place } from "@/types/place";
import {
  X,
  Search,
  Loader2,
  MapPin,
  Star,
  Calendar,
  Utensils,
  MessageSquare,
  ChevronLeft,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceAdded: (place: Place) => void;
  availableGenres: string[];
  adminKey?: string | null;
}

const DEFAULT_GENRES = [
  "朝ごはん",
  "昼ごはん",
  "夜ごはん",
  "パン屋",
  "カフェ",
  "その他",
];

const RATINGS = [
  { label: "未設定", value: "" },
  { label: "★★★★★ (5点)", value: "★5" },
  { label: "★★★★☆ (4点)", value: "★4" },
  { label: "★★★☆☆ (3点)", value: "★3" },
  { label: "★★☆☆☆ (2点)", value: "★2" },
  { label: "★☆☆☆☆ (1点)", value: "★1" },
];

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  isOpen,
  onClose,
  onPlaceAdded,
  availableGenres,
  adminKey,
}) => {
  const [step, setStep] = useState<"search" | "confirm">("search");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<GooglePlaceSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 選択された店舗とフォーム状態
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceSearchResult | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["カフェ"]);
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  // ジャンルリストのマージ
  const genreOptions = Array.from(new Set([...DEFAULT_GENRES, ...availableGenres])).filter(
    Boolean
  );

  const toggleGenreChip = (g: string) => {
    if (selectedGenres.includes(g)) {
      // 最低1つは残す
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((item) => item !== g));
      }
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setCandidates([]);

    try {
      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "検索に失敗しました。");
      }

      if (!data.results || data.results.length === 0) {
        setSearchError("該当する店舗が見つかりませんでした。店名やエリア名を変えてお試しください。");
      } else {
        setCandidates(data.results);
      }
    } catch (err: any) {
      setSearchError(err.message || "通信エラーが発生しました。");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCandidate = (place: GooglePlaceSearchResult) => {
    setSelectedPlace(place);
    const initialGenres =
      place.genres && place.genres.length > 0
        ? place.genres
        : [place.genre || "カフェ"];
    setSelectedGenres(initialGenres);
    setStep("confirm");
    setSubmitError(null);
  };

  const handleResetToSearch = () => {
    setStep("search");
    setSelectedPlace(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/places/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place: selectedPlace,
          genre: selectedGenres[0] || "その他",
          genres: selectedGenres,
          visitDate,
          rating,
          notes,
          adminKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Notionへの登録に失敗しました。");
      }

      if (data.success && data.place) {
        onPlaceAdded(data.place);
        handleClose();
      }
    } catch (err: any) {
      setSubmitError(err.message || "登録中にエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("search");
    setQuery("");
    setCandidates([]);
    setSelectedPlace(null);
    setSearchError(null);
    setSubmitError(null);
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
        {/* モーダルヘッダー */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {step === "confirm" && (
              <button
                type="button"
                onClick={handleResetToSearch}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>🗺️</span>
              <span>{step === "search" ? "店舗を検索・追加" : "店舗詳細とメモの登録"}</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* モーダルコンテンツ（スクロール可能） */}
        <div className="p-5 overflow-y-auto flex-1">
          {step === "search" ? (
            /* ── STEP 1: 検索フェーズ ── */
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="店名やエリアを入力 (例: ブルーボトル 六本木)"
                    className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 shrink-0"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "検索"}
                </button>
              </form>

              {searchError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                  {searchError}
                </div>
              )}

              {/* 検索候補一覧 */}
              <div className="space-y-2.5 pt-1">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => handleSelectCandidate(cand)}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800/60 hover:shadow-md cursor-pointer transition-all group"
                  >
                    {/* サムネイル写真 */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 relative">
                      {cand.photoUrl ? (
                        <img
                          src={cand.photoUrl}
                          alt={cand.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* 店舗概要 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                          {cand.genre}
                        </span>
                        {cand.googleRating && (
                          <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {cand.googleRating}
                          </span>
                        )}
                        {cand.isVegan && (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                            🌱 ビーガン
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate mt-1">
                        {cand.name}
                      </h3>

                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{cand.address}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      className="self-center shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 rounded-xl transition-colors"
                    >
                      選択
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── STEP 2: カスタマイズ・確認フェーズ ── */
            selectedPlace && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 選択店舗プレビューバナー */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                    {selectedPlace.photoUrl ? (
                      <img
                        src={selectedPlace.photoUrl}
                        alt={selectedPlace.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        ☕
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {selectedPlace.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {selectedPlace.address}
                    </p>
                    {selectedPlace.mapsUrl && (
                      <a
                        href={selectedPlace.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-0.5"
                      >
                        <span>Googleマップで確認</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* フォーム入力欄 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* ジャンル選択 (複数選択チップ) */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-amber-500" />
                        <span>ジャンル</span>
                        <span className="text-[10px] text-gray-400 font-normal ml-1">
                          (複数選択可 / 先頭が代表ピン)
                        </span>
                      </label>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                        {selectedGenres.length}個選択中
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {genreOptions.map((g, idx) => {
                        const isSelected = selectedGenres.includes(g);
                        const isPrimary = selectedGenres[0] === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleGenreChip(g)}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 ${
                              isSelected
                                ? isPrimary
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm font-bold ring-2 ring-blue-300 dark:ring-blue-800"
                                  : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-medium"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <span>{g}</span>
                            {isPrimary && (
                              <span className="text-[9px] bg-white/20 px-1 rounded text-white">
                                代表
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 訪問日 */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>訪問日</span>
                    </label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* あなたの評価 */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                    <span>あなたの評価</span>
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {RATINGS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* メモ・コメント */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <span>メモ・感想 (任意)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="注文したメニュー、店内の雰囲気、コンセントの有無など..."
                    className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                    {submitError}
                  </div>
                )}

                {/* 送信ボタン */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResetToSearch}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    選び直す
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Notionに登録中...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Notionに登録する</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;
