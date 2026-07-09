"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Props = {
  data: { label: string; value: number }[];
  title: string;
  color?: string;
};

export default function SalesChart({ data, title, color = "#818cf8" }: Props) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-4 text-sm font-black text-white/80">{title}</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
