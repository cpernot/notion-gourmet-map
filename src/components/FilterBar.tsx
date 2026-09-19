"use client";

import React, { useState } from "react";
import { FilterState } from "@/types/place";
import {
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Leaf,
  Car,
  Calendar,
  Clock,
  Utensils,
  Star,
} from "lucide-react";

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  count: number;
  total: number;
  availableGenres: string[];
}

const RATINGS = [
  { label: "全評価", value: "all" },
  { label: "★5 のみ", value: "5" },
  { label: "★4 以上", value: "4" },
  { label: "★3 以上", value: "3" },
];

const DAYS = [
  { label: "全曜日", value: "all" },
  { label: "月曜", value: "月" },
  { label: "火曜", value: "火" },
  { label: "水曜", value: "水" },
  { label: "木曜", value: "木" },
  { label: "金曜", value: "金" },
  { label: "土曜", value: "土" },
  { label: "日曜", value: "日" },
];

const TIME_SLOTS = [
  { label: "全時間帯", value: "all" },
  { label: "🌅 朝 (〜10時)", value: "🌅 朝" },
  { label: "🥐 モーニング (10〜12時)", value: "🥐 モーニング" },
  { label: "☀️ ランチ (11〜14時)", value: "☀️ ランチ" },
  { label: "☕ カフェ (14〜17時)", value: "☕ カフェ" },
  { label: "🌙 ディナー (17〜21時)", value: "🌙 ディナー" },
  { label: "🌃 深夜営業 (22時〜)", value: "🌃 深夜営業" },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  count,
  total,
  availableGenres,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, genre: e.target.value });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, rating: e.target.value });
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, day: e.target.value });
  };

  const handleTimeSlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, timeSlot: e.target.value });
  };

  const handleVeganToggle = () => {
    onChange({ ...filters, veganOnly: !filters.veganOnly });
  };

  const handleParkingToggle = () => {
    onChange({ ...filters, parkingOnly: !filters.parkingOnly });
  };

  const handleReset = () => {
    onChange({
      genre: "all",
      rating: "all",
      day: "all",
      timeSlot: "all",
      veganOnly: false,
      parkingOnly: false,
    });
  };

  const hasActiveFilters =
    filters.genre !== "all" ||
    filters.rating !== "all" ||
    filters.day !== "all" ||
    filters.timeSlot !== "all" ||
    filters.veganOnly ||
    filters.parkingOnly;

  return (
    <div className="absolute top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto max-w-[96vw] z-[1000]">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-800 p-3 transition-all duration-200">
        {/* モバイル用折りたたみヘッダー & PC共通サマリーバー */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/30">
              ☕
            </span>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight">
                Notion グルメマップ
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span>
                  該当: <strong className="text-blue-600 dark:text-blue-400 font-bold">{count}</strong> / {total} 件
                </span>
                {hasActiveFilters && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="条件をクリア"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">リセット</span>
              </button>
            )}

            {/* モバイル用開閉トグルボタン */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="sm:hidden flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium px-2.5 py-1.5 rounded-xl active:scale-95 transition-all"
            >
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>フィルター</span>
              {isOpen ? (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* フィルターコントロール群（PCでは常時インライン、スマホではアコーディオン展開） */}
        <div
          className={`${
            isOpen ? "flex" : "hidden sm:flex"
          } flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 sm:mt-2.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 flex-wrap`}
        >
          {/* ① ジャンルセレクター */}
          <div className="relative flex-1 sm:w-36">
            <label className="sm:hidden text-[10px] font-semibold text-gray-500 block mb-1">
              ① ジャンル
            </label>
            <div className="relative">
              <Utensils className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 pointer-events-none" />
              <select
                value={filters.genre}
                onChange={handleGenreChange}
                className="w-full text-xs font-medium bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-7 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">全ジャンル</option>
                {availableGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ② 評価セレクター */}
          <div className="relative flex-1 sm:w-28">
            <label className="sm:hidden text-[10px] font-semibold text-gray-500 block mb-1">
              ② 評価
            </label>
            <div className="relative">
              <Star className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-yellow-500 fill-yellow-400 pointer-events-none" />
              <select
                value={filters.rating}
                onChange={handleRatingChange}
                className="w-full text-xs font-medium bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-7 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {RATINGS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ③ 営業曜日セレクター */}
          <div className="relative flex-1 sm:w-28">
            <label className="sm:hidden text-[10px] font-semibold text-gray-500 block mb-1">
              ③ 営業曜日
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={filters.day}
                onChange={handleDayChange}
                className="w-full text-xs font-medium bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-7 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ④ 時間帯セレクター */}
          <div className="relative flex-1 sm:w-40">
            <label className="sm:hidden text-[10px] font-semibold text-gray-500 block mb-1">
              ④ 時間帯
            </label>
            <div className="relative">
              <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={filters.timeSlot}
                onChange={handleTimeSlotChange}
                className="w-full text-xs font-medium bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-7 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* トグルボタン群（⑤ ヴィーガン, ⑥ 駐車場あり） */}
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 pt-1 sm:pt-0">
            {/* ⑤ ヴィーガン限定 */}
            <button
              type="button"
              onClick={handleVeganToggle}
              className={`flex items-center justify-center gap-1 text-xs font-medium py-2 px-3 rounded-xl border transition-all active:scale-95 ${
                filters.veganOnly
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/30"
                  : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
              }`}
            >
              <Leaf className={`w-3.5 h-3.5 ${filters.veganOnly ? "text-white" : "text-emerald-600"}`} />
              <span>ヴィーガン</span>
            </button>

            {/* ⑥ 駐車場あり限定 */}
            <button
              type="button"
              onClick={handleParkingToggle}
              className={`flex items-center justify-center gap-1 text-xs font-medium py-2 px-3 rounded-xl border transition-all active:scale-95 ${
                filters.parkingOnly
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30"
                  : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
              }`}
            >
              <Car className={`w-3.5 h-3.5 ${filters.parkingOnly ? "text-white" : "text-blue-600"}`} />
              <span>駐車場あり</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
