"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface OptionItem {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: OptionItem[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  allLabel: string;
  className?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  icon,
  options,
  selectedValues,
  onChange,
  allLabel,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 外側クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  // 表示用テキストの生成
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return allLabel;
    }
    if (selectedValues.length === 1) {
      const match = options.find((o) => o.value === selectedValues[0]);
      return match ? match.label : selectedValues[0];
    }
    // 複数選択の場合: 最初 + 件数
    const firstMatch = options.find((o) => o.value === selectedValues[0]);
    const firstName = firstMatch ? firstMatch.label : selectedValues[0];
    return `${firstName} (+${selectedValues.length - 1})`;
  };

  const isSelectedAll = selectedValues.length === 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* スマホ用ラベル */}
      <span className="sm:hidden text-[10px] font-semibold text-gray-500 block mb-1">
        {label}
      </span>

      {/* トリガーボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-xs font-medium rounded-xl pl-8 pr-2.5 py-2 transition-all border text-left ${
          selectedValues.length > 0
            ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-sm"
            : "bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100"
        }`}
      >
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {icon}
        </span>
        <span className="truncate pr-1 font-medium">{getDisplayText()}</span>
        <div className="flex items-center gap-1 shrink-0">
          {selectedValues.length > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">
              {selectedValues.length}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </div>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-56 sm:w-60 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-[1100] max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {/* ヘッダー操作部 */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 text-[11px]">
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              {label} (複数選択可)
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className={`hover:underline font-medium ${
                isSelectedAll
                  ? "text-gray-400 cursor-default"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              すべて選択
            </button>
          </div>

          {/* オプション一覧 */}
          <div className="py-1">
            {/* 「すべて」項目 */}
            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
            >
              <span
                className={`${
                  isSelectedAll
                    ? "font-bold text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {allLabel}
              </span>
              {isSelectedAll && <Check className="w-4 h-4 text-blue-600" />}
            </button>

            {/* 個別項目 */}
            {options.map((opt) => {
              const checked = selectedValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                >
                  <span
                    className={`${
                      checked
                        ? "font-bold text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
