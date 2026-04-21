'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    [key: string]: {
      label: string;
      value: string;
      options: FilterOption[];
      onChange: (value: string) => void;
    };
  };
  placeholder?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  filters,
  placeholder = 'Search...',
}: FilterBarProps) {
  const hasFilters = filters && Object.keys(filters).length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-indigo-500/20 bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-4 py-2">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(filters).map(([key, filter]) => (
            <select
              key={key}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="rounded-lg border border-indigo-500/20 bg-gray-800 px-3 py-2 text-sm text-white outline-none hover:border-indigo-500/40 focus:border-indigo-500/60"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
    </div>
  );
}
