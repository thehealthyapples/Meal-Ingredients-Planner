import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface HealthTrendData {
  id: number;
  userId: number;
  date: string;
  averageSmpRating: number;
  eliteCount: number;
  processedCount: number;
  sampleCount: number;
}

type Period = 7 | 30 | 90;

export default function HealthTrendChart() {
  const [period, setPeriod] = useState<Period>(30);

  const { data: trends = [], isLoading } = useQuery<HealthTrendData[]>({
    queryKey: ["/api/user/health-trends", period],
    queryFn: async () => {
      const res = await fetch(`/api/user/health-trends?days=${period}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trends");
      return res.json();
    },
  });

  const chartData = trends.map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    rating: t.averageSmpRating,
    elite: t.eliteCount,
    processed: t.processedCount,
    samples: t.sampleCount,
  }));

  const avgRating =
    chartData.length > 0
      ? (chartData.reduce((sum, d) => sum + d.rating, 0) / chartData.length).toFixed(1)
      : "0";

  const totalElite = trends.reduce((sum, t) => sum + t.eliteCount, 0);
  const totalProcessed = trends.reduce((sum, t) => sum + t.processedCount, 0);

  return (
    <Card data-testid="card-health-trend">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Health Score Trend
        </CardTitle>
        <div className="flex gap-1">
          {([7, 30, 90] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              data-testid={`button-period-${p}`}
            >
              {p}d
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No data yet. Analyse products to start tracking.
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-3 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Avg Rating</span>
                <span className="font-semibold text-base" data-testid="text-avg-rating">
                  {avgRating}/5
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Elite Picks</span>
                <span className="font-semibold text-base text-green-600 dark:text-green-400" data-testid="text-elite-count">
                  {totalElite}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Processed</span>
                <span className="font-semibold text-base text-red-600 dark:text-red-400" data-testid="text-processed-count">
                  {totalProcessed}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  width={25}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [value.toFixed(1), "Avg Rating"]}
                />
                <Area
                  type="monotone"
                  dataKey="rating"
                  stroke="hsl(var(--primary))"
                  fill="url(#ratingGradient)"
                  strokeWidth={2}
                  dot={chartData.length <= 14}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
