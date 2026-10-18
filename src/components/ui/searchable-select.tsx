'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyText?: string;
}

export function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  emptyText = 'No matches found',
}: SearchableSelectProps) {
  const selected = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selected?.label || '');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    setQuery(selected?.label || '');
  }, [selected?.label]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = normalizedQuery
      ? options.filter((option) =>
          `${option.label} ${option.description || ''}`.toLowerCase().includes(normalizedQuery)
        )
      : options;

    return matches.slice(0, 50);
  }, [options, query]);

  const choose = (option: SearchableSelectOption) => {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    setHighlightedIndex(0);
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-base font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          disabled={disabled}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlightedIndex(0);
            if (!event.target.value) {
              onChange('');
            }
          }}
          onKeyDown={(event) => {
            if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
              setOpen(true);
              return;
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlightedIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlightedIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === 'Enter' && filteredOptions[highlightedIndex]) {
              event.preventDefault();
              choose(filteredOptions[highlightedIndex]);
            }
            if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="h-14 rounded-lg border-border bg-card pl-10 text-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
        />
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
          {filteredOptions.length === 0 ? (
            <p className="px-4 py-4 text-base text-muted-foreground">{emptyText}</p>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  type="button"
                  key={option.value}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={cn(
                    'flex min-h-14 w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0',
                    isHighlighted ? 'bg-secondary' : 'bg-card'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">{option.label}</p>
                    {option.description && <p className="truncate text-sm text-muted-foreground">{option.description}</p>}
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
