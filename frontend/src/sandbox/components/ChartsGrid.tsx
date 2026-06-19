import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SamplesStats } from '../api/sandboxClient';

interface Props {
  stats: SamplesStats | null;
}

const PIE_COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

export function ChartsGrid({ stats }: Props) {
  const byDayByVersion = stats?.by_day_by_version ?? [];
  const versionKeys = useMemo(() => {
    const set = new Set<string>();
    for (const row of byDayByVersion) {
      for (const k of Object.keys(row)) {
        if (k !== 'date') set.add(k);
      }
    }
    return Array.from(set).sort();
  }, [byDayByVersion]);

  return (
    <div className="sbx-charts-grid">
      <div className="sbx-chart-card">
        <h3>Samples per day (by context version)</h3>
        <div className="sbx-chart-host">
          {byDayByVersion.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDayByVersion}>
                <CartesianGrid strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {versionKeys.map((k, i) => (
                  <Bar
                    key={k}
                    dataKey={k}
                    stackId="ver"
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="sbx-chart-card">
        <h3>By model</h3>
        <div className="sbx-chart-host">
          {!stats || stats.by_model.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.by_model}
                layout="vertical"
                margin={{ left: 60, right: 12, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeOpacity={0.15} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="key"
                  tick={{ fontSize: 11 }}
                  width={140}
                  interval={0}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="sbx-chart-card">
        <h3>By mode</h3>
        <div className="sbx-chart-host">
          {!stats || stats.by_mode.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.by_mode}>
                <CartesianGrid strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="count" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="sbx-chart-card">
        <h3>Share by context version</h3>
        <div className="sbx-chart-host">
          {!stats || stats.by_context_version.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Pie
                  data={stats.by_context_version}
                  dataKey="count"
                  nameKey="key"
                  cx="50%"
                  cy="50%"
                  outerRadius="78%"
                  innerRadius="42%"
                  label={(d) => `${d.name ?? ''}: ${d.value ?? 0}`}
                  labelLine={false}
                >
                  {stats.by_context_version.map((entry, i) => (
                    <Cell key={entry.key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return <div className="sbx-empty">No data yet.</div>;
}
