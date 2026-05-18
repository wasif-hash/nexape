import type { AnalyticsSummary } from "@/shared";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

interface Props {
  data: AnalyticsSummary | undefined;
  isLoading: boolean;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsCards({ data, isLoading }: Props) {
  const placeholder = isLoading || !data ? "—" : null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Stat label="Total leads" value={placeholder ?? data!.total} />
      <Stat label="New this week" value={placeholder ?? data!.last7Days} />
      <Stat label="Converted" value={placeholder ?? data!.byStatus.CONVERTED} />
    </div>
  );
}
