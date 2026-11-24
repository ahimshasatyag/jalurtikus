import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Crosshair } from 'lucide-react';
import { locationService } from '../../services/locationService';
import type { LocationCandidate, Coordinates } from '../../types';

interface LocationSearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onSelect: (coords: Coordinates, displayName: string) => void;
  iconColor?: string;
  onGpsClick?: () => void;
  isGpsLoading?: boolean;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder,
  value,
  onSelect,
  iconColor = 'text-primary',
  onGpsClick,
  isGpsLoading = false,
}) => {
  const [query, setQuery] = useState(value);
  const [candidates, setCandidates] = useState<LocationCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setCandidates([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await locationService.searchLocations(val, 5);
      setCandidates(results);
      setIsOpen(true);
    } catch {
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (item: LocationCandidate) => {
    setQuery(item.name);
    setIsOpen(false);
    onSelect({ latitude: item.latitude, longitude: item.longitude }, item.name);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-semibold text-text-secondary mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <MapPin className={`absolute left-3 w-4 h-4 ${iconColor}`} />
        <input
          type="text"
          className={`w-full bg-surface border border-border rounded-lg pl-9 ${onGpsClick ? 'pr-14' : 'pr-8'} py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (candidates.length > 0) setIsOpen(true);
          }}
        />
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-text-secondary animate-spin" />
          )}
          {onGpsClick && (
            <button
              type="button"
              onClick={onGpsClick}
              disabled={isGpsLoading}
              title="Gunakan Lokasi GPS Saya"
              className="p-1 rounded text-text-secondary hover:text-primary hover:bg-surface-secondary transition disabled:opacity-50"
            >
              {isGpsLoading ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4 text-info hover:text-primary" />
              )}
            </button>
          )}
        </div>
      </div>

      {isOpen && candidates.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-surface-secondary border border-border rounded-lg shadow-2xl max-h-56 overflow-y-auto">
          {candidates.map((item) => (
            <li
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="px-3 py-2.5 hover:bg-surface border-b border-border/50 last:border-b-0 cursor-pointer transition text-left"
            >
              <div className="text-sm font-medium text-text-primary">{item.name}</div>
              <div className="text-xs text-text-secondary truncate">{item.display_name}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
