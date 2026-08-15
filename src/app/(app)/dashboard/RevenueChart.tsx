"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MESES_ABREV } from "@/lib/format";
import { formatBRL } from "@/lib/format";

export function RevenueChart({ data }: { data: number[] }) {
  const chartData = data.map((value, i) => ({ mes: MESES_ABREV[i], value }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="mes"
            axisLine={{ stroke: "var(--line)" }}
            tickLine={false}
            tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "var(--stamp-tint)" }}
            formatter={(value) => [formatBRL(Number(value)), "Faturamento"]}
            labelStyle={{ color: "var(--ink)" }}
            contentStyle={{
              background: "var(--paper-raised)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" fill="var(--stamp)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
