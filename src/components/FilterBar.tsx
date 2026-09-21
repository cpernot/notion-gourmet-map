"use client";

import React, { useState } from "react";
import { FilterState } from "@/types/place";
import { MultiSelectDropdown, OptionItem } from "./MultiSelectDropdown";
import {
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Building2,
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

const RATINGS: OptionItem[] = [
  { label: "★5", value: "5" },
  { label: "★4", value: "4" },
  { label: "★3", value: "3" },
  { label: "★2", value: "2" },
  { label: "★1", value: "1" },
];

const DAYS: OptionItem[] = [
  { label: "月曜", value: "月" },
  { label: "火曜", value: "火" },
  { label: "水曜", value: "水" },
  { label: "木曜", value: "木" },
  { label: "金曜", value: "金" },
  { label: "土曜", value: "土" },
  { label: "日曜", value: "日" },
];

const TIME_SLOTS: OptionItem[] = [
  { label: "-9:00", value: "🌅 朝" },
  { label: "9:00-11:00", value: "🥐 モーニング" },
  { label: "11:00-14:00", value: "☀️ ランチ" },
  { label: "14:00-17:00", value: "☕ カフェ" },
  { label: "17:00-22:00", value: "🌙 ディナー" },
  { label: "22:00-", value: "🌃 深夜営業" },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  count,
  total,
  availableGenres,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleGenresChange = (genres: string[]) => {
    onChange({ ...filters, genres });
  };

  const handleRatingsChange = (ratings: string[]) => {
    onChange({ ...filters, ratings });
  };

  const handleDaysChange = (days: string[]) => {
    onChange({ ...filters, days });
  };

  const handleTimeSlotsChange = (timeSlots: string[]) => {
    onChange({ ...filters, timeSlots });
  };

  const handleChainToggle = () => {
    onChange({ ...filters, chainOnly: !filters.chainOnly });
  };

  const handleOpenNowToggle = () => {
    onChange({ ...filters, openNow: !filters.openNow });
  };

  const handleParkingToggle = () => {
    onChange({ ...filters, parkingOnly: !filters.parkingOnly });
  };

  const handleReset = () => {
    onChange({
      genres: [],
      ratings: [],
      days: [],
      timeSlots: [],
      chainOnly: false,
      openNow: false,
      parkingOnly: false,
    });
  };

  const hasActiveFilters =
    filters.genres.length > 0 ||
    filters.ratings.length > 0 ||
    filters.days.length > 0 ||
    filters.timeSlots.length > 0 ||
    filters.chainOnly ||
    filters.openNow ||
    filters.parkingOnly;

  return (
    <div className="absolute top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto max-w-[96vw] z-[1000]">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-800 p-3 transition-all duration-200">
        {/* モバイル用折りたたみヘッダー & PC共通サマリーバー */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 p-1 border border-amber-200/60 dark:border-amber-800/60 shadow-md">
              <img
                src="/coffee.png"
                alt="mogu."
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                mogu.
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
          className={`${isOpen ? "flex" : "hidden sm:flex"
            } flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 sm:mt-2.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 flex-wrap`}
        >
          {/* ① ジャンルセレクター */}
          <MultiSelectDropdown
            label="① ジャンル"
            icon={<Utensils className="w-3.5 h-3.5 text-amber-500" />}
            options={availableGenres.map((g) => ({ label: g, value: g }))}
            selectedValues={filters.genres}
            onChange={handleGenresChange}
            allLabel="全ジャンル"
            className="flex-1 sm:w-36"
          />

          {/* ② 評価セレクター */}
          <MultiSelectDropdown
            label="② 評価"
            icon={<Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />}
            options={RATINGS}
            selectedValues={filters.ratings}
            onChange={handleRatingsChange}
            allLabel="全評価"
            className="flex-1 sm:w-28"
          />

          {/* ③ 営業曜日セレクター */}
          <MultiSelectDropdown
            label="③ 営業曜日"
            icon={<Calendar className="w-3.5 h-3.5 text-blue-500" />}
            options={DAYS}
            selectedValues={filters.days}
            onChange={handleDaysChange}
            allLabel="全曜日"
            className="flex-1 sm:w-28"
          />

          {/* ④ 時間帯セレクター */}
          <MultiSelectDropdown
            label="④ 時間帯"
            icon={<Clock className="w-3.5 h-3.5 text-indigo-500" />}
            options={TIME_SLOTS}
            selectedValues={filters.timeSlots}
            onChange={handleTimeSlotsChange}
            allLabel="全時間帯"
            className="flex-1 sm:w-40"
          />

          {/* トグルボタン群（⑤ 営業中, ⑥ チェーン店, ⑦ 駐車場あり） */}
          <div className="flex items-center gap-1.5 pt-1 sm:pt-0 flex-wrap">
            {/* ⑤ 営業中限定 */}
            <button
              type="button"
              onClick={handleOpenNowToggle}
              className={`flex items-center justify-center gap-1 text-xs font-medium py-2 px-3 rounded-xl border transition-all active:scale-95 ${
                filters.openNow
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/30"
                  : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${filters.openNow ? "bg-white animate-pulse" : "bg-emerald-500"}`} />
              <span>営業中</span>
            </button>

            {/* ⑥ チェーン店限定 */}
            <button
              type="button"
              onClick={handleChainToggle}
              className={`flex items-center justify-center gap-1 text-xs font-medium py-2 px-3 rounded-xl border transition-all active:scale-95 ${
                filters.chainOnly
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-500/30"
                  : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${filters.chainOnly ? "text-white" : "text-amber-600"}`} />
              <span>チェーン店</span>
            </button>

            {/* ⑦ 駐車場あり限定 */}
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
