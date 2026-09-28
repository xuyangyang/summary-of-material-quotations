import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getGroups,
  getPriceHistory,
  type MaterialGroup,
  type PriceHistoryItem,
} from "../api";
import { calcPriceStats, fmtNum } from "../utils";
import MaterialPicker from "../components/MaterialPicker";

export default function PricesPage({ batchId }: { batchId: number }) {
  const [groups, setGroups] = useState<MaterialGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [rows, setRows] = useState<PriceHistoryItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!batchId) {
      setGroups([]);
      return;
    }
    getGroups(batchId)
      .then((data) => {
        setGroups(data);
        setSelectedGroupId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"));
  }, [batchId]);

  useEffect(() => {
    if (!batchId || !selectedGroupId) {
      setRows([]);
      return;
    }
    setError("");
    getPriceHistory(batchId, selectedGroupId)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"));
  }, [batchId, selectedGroupId]);

  const stats = useMemo(() => calcPriceStats(rows), [rows]);
  const selected = groups.find((group) => group.id === selectedGroupId);

  return (
    <section className="stack">
      <div className="panel filters">
        <label className="inline-label">
          <span>选择材料</span>
          <MaterialPicker
            groups={groups}
            value={selectedGroupId}
            onChange={setSelectedGroupId}
          />
        </label>
        {selected && (
          <div className="muted">
            {selected.material_name} · {selected.spec || "无规格"} · {selected.record_count} 条记录
          </div>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="stat-grid">
        <Stat label="最低价" value={fmtNum(stats.min)} />
        <Stat label="最高价" value={fmtNum(stats.max)} />
        <Stat label="简单均价" value={fmtNum(stats.avg)} />
        <Stat label="加权均价" value={fmtNum(stats.weightedAvg)} />
        <Stat label="最近价" value={fmtNum(stats.latest)} hint={stats.latestDate} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>历史价格趋势</h2>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rows}>
              <XAxis dataKey="purchase_date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="unit_price" stroke="#2563eb" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>价格明细</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>采购日期</th>
                <th className="col-supplier">供应商</th>
                <th>采购量</th>
                <th>单价</th>
                <th>金额</th>
                <th>项目</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>{row.purchase_date}</td>
                  <td className="col-supplier" title={row.supplier}>
                    {row.supplier}
                  </td>
                  <td>{fmtNum(row.quantity)}</td>
                  <td>{fmtNum(row.unit_price)}</td>
                  <td>{fmtNum(row.amount)}</td>
                  <td>{row.project}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-hint">
                    暂无价格记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}
