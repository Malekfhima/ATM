import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Grid, Paper, Typography } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import DonutSmallIcon from "@mui/icons-material/DonutSmall";
import { formatCurrency, formatDate } from "../utils/format";

const TYPE_COLORS = {
  deposit: "#10b981",
  withdrawal: "#e11d48",
  transfer: "#1f5cad",
};

const TYPE_LABELS = {
  deposit: "Dépôt",
  withdrawal: "Retrait",
  transfer: "Virement",
};

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 61, 122, 0.12)",
};

function ChartCard({ title, icon, className = "", children }) {
  return (
    <Paper
      elevation={0}
      className={`card-lift ${className}`}
      sx={{ borderRadius: 4, p: 3, height: "100%" }}
    >
      <Typography
        variant="h6"
        sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
      >
        {icon} {title}
      </Typography>
      {children}
    </Paper>
  );
}

function EmptyChart({ message }) {
  return (
    <Box
      sx={{
        height: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
      }}
    >
      <ShowChartIcon sx={{ fontSize: 52, color: "text.disabled", opacity: 0.6 }} />
      <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 260 }}>
        {message}
      </Typography>
    </Box>
  );
}

export default function AccountCharts({ transactions = [] }) {
  const gradientId = useId();
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

  const sorted = useMemo(
    () =>
      [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [transactions]
  );

  // Courbe du solde : un point par opération (solde après), précédé de 0
  const balanceData = useMemo(() => {
    const points = sorted.map((t) => ({
      time: formatDate(t.date),
      solde: t.balanceAfter,
    }));
    if (points.length === 0) return [];
    if (points[0].solde !== 0) {
      points.unshift({ time: "Ouverture", solde: 0 });
    }
    return points.slice(-31);
  }, [sorted]);

  // Répartition des montants par type d'opération
  const typeData = useMemo(() => {
    const totals = {};
    sorted.forEach((t) => {
      totals[t.type] = (totals[t.type] || 0) + t.amount;
    });
    return Object.entries(totals)
      .filter(([, value]) => value > 0)
      .map(([type, value]) => ({
        name: TYPE_LABELS[type] || type,
        type,
        value: Math.round(value * 1000) / 1000,
      }));
  }, [sorted]);

  const hasData = sorted.length > 0;

  return (
    <Grid container spacing={3} className="anim-fade-up anim-delay-2">
      {/* Évolution du solde */}
      <Grid item xs={12} md={7}>
        <ChartCard title="Évolution du solde" icon={<ShowChartIcon color="primary" />}>
          {!hasData ? (
            <EmptyChart message="Votre courbe de solde apparaîtra ici après vos premières opérations." />
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <AreaChart
                data={balanceData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f5cad" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1f5cad" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  minTickGap={50}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={70}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(v)
                  }
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Solde"]}
                  contentStyle={tooltipStyle}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="solde"
                  stroke="#1f5cad"
                  strokeWidth={2.5}
                  fill={`url(#${gradientId})`}
                  animationDuration={1200}
                  isAnimationActive={!reduceMotion}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Grid>

      {/* Répartition des opérations */}
      <Grid item xs={12} md={5}>
        <ChartCard
          title="Répartition des opérations"
          icon={<DonutSmallIcon color="secondary" />}
          className="anim-delay-3"
        >
          {!hasData ? (
            <EmptyChart message="La répartition de vos opérations apparaîtra ici après vos premières opérations." />
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  animationDuration={1000}
                  isAnimationActive={!reduceMotion}
                >
                  {typeData.map((entry) => (
                    <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} />
                <Legend
                  formatter={(name) => <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Grid>
    </Grid>
  );
}
