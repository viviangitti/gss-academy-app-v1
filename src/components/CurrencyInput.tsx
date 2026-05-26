import { useState, useEffect, useRef } from 'react';
import './CurrencyInput.css';

interface Props {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  presets?: number[];
  icon?: React.ReactNode;
}

function formatBRL(n: number): string {
  if (!n) return '';
  return n.toLocaleString('pt-BR');
}

function parseInput(raw: string): number {
  // Remove tudo que não for dígito
  const digits = raw.replace(/\D/g, '');
  return Number(digits) || 0;
}

function labelPreset(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return String(n);
}

const DEFAULT_PRESETS = [50_000, 100_000, 150_000, 200_000, 250_000, 300_000, 500_000];

export default function CurrencyInput({ value, onChange, placeholder = '0', presets = DEFAULT_PRESETS, icon }: Props) {
  const [inputVal, setInputVal] = useState(formatBRL(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g., chip click from parent or reset)
  useEffect(() => {
    setInputVal(formatBRL(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseInput(raw);
    setInputVal(formatBRL(num) || '');
    onChange(num);
  };

  const handleBlur = () => {
    setInputVal(formatBRL(value));
  };

  const handleFocus = () => {
    // Seleciona tudo ao focar para facilitar substituição
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const handlePreset = (preset: number) => {
    onChange(preset);
    setInputVal(formatBRL(preset));
    inputRef.current?.blur();
  };

  return (
    <div className="ci-wrap">
      {/* Chips de atalho */}
      <div className="ci-presets">
        {presets.map(p => (
          <button
            key={p}
            type="button"
            className={`ci-chip ${value === p ? 'active' : ''}`}
            onClick={() => handlePreset(p)}
          >
            {labelPreset(p)}
          </button>
        ))}
      </div>

      {/* Input formatado */}
      <div className="ci-input-wrap">
        <span className="ci-prefix">{icon || 'R$'}</span>
        <input
          ref={inputRef}
          className="ci-input"
          inputMode="numeric"
          value={inputVal}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
        />
        {value > 0 && (
          <span className="ci-live">
            {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
          </span>
        )}
      </div>
    </div>
  );
}
