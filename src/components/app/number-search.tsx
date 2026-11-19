'use client';

import { useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * Customer search that opens the phone's number pad, because most people searching here can
 * type a mobile number but not a name. The ABC button switches to letters for a name search.
 */
export function NumberSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [letters, setLetters] = useState(false);

  const switchKeyboard = () => {
    setLetters((on) => !on);
    // The keyboard only changes when the box is focused again.
    inputRef.current?.blur();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        inputMode={letters ? 'text' : 'numeric'}
        enterKeyHint="search"
        autoComplete="off"
        placeholder={letters ? 'Search by name or profession' : 'Search by mobile number'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-20 h-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={switchKeyboard}
        aria-label={letters ? 'Use number pad' : 'Type letters'}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 min-w-16 rounded-md bg-secondary px-3 text-sm font-bold text-primary"
      >
        {letters ? '123' : 'ABC'}
      </button>
    </div>
  );
}
