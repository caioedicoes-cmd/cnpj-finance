"use client";

import { MESES } from "@/lib/format";
import { Select } from "@/components/ui/Field";

export function MonthFilter({
  month,
  year,
  years,
  onChange,
}: {
  month: number;
  year: number;
  years: number[];
  onChange: (month: number, year: number) => void;
}) {
  return (
    <div className="flex gap-2">
      <Select
        value={month}
        onChange={(e) => onChange(Number(e.target.value), year)}
        aria-label="Mês"
        className="w-auto"
      >
        {MESES.map((m, i) => (
          <option key={m} value={i}>
            {m}
          </option>
        ))}
      </Select>
      <Select
        value={year}
        onChange={(e) => onChange(month, Number(e.target.value))}
        aria-label="Ano"
        className="w-auto"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  );
}
