import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AnalyticsSummary } from "@nexape/shared";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

const COLORS = {
  NEW: "#3b82f6",
  CONTACTED: "#f59e0b",
  CONVERTED: "#10b981",
} as const;

export function AnalyticsChart({ data }: { data: AnalyticsSummary | undefined }) {
  const chartData = data
    ? [
        { name: "New", value: data.byStatus.NEW, key: "NEW" as const },
        { name: "Contacted", value: data.byStatus.CONTACTED, key: "CONTACTED" as const },
        { name: "Converted", value: data.byStatus.CONVERTED, key: "CONVERTED" as const },
      ]
    : [];

  const isEmpty = chartData.every((d) => d.value === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads by status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          {isEmpty ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
