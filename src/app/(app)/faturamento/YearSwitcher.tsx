"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Field";

export function YearSwitcher({ years, current }: { years: number[]; current: number }) {
  const router = useRouter();
  return (
    <Select
      value={current}
      onChange={(e) => router.push(`/faturamento?ano=${e.target.value}`)}
      aria-label="Selecionar ano"
      className="w-auto"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </Select>
  );
}
