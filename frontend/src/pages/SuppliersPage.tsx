import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getGroups,
  getSupplierSummary,
  type MaterialGroup,
  type SupplierSummary,
} from "../api";
import { fmtNum } from "../utils";
import MaterialPicker from "../components/MaterialPicker";

export default function SuppliersPage({ batchId }: { batchId: number }) {
  const [groups, setGroups] = useState<MaterialGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [rows, setRows] = useState<SupplierSummary[]>([]);
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
    getSupplierSummary(batchId, selectedGroupId)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"));
  }, [batchId, selectedGroupId]);

  const chartData = rows.map((row) => ({
    name: row.supplier,
    avg_price: row.avg_price,
    latest_price: row.latest_price,
  }));

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
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <h2>厂家价格对比</h2>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg_price" name="平均价" fill="#2563eb" />
              <Bar dataKey="latest_price" name="最近价" fill="#93c5fd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>厂家价格明细</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-supplier-wrap">厂家</th>
                <th>记录数</th>
                <th>最低价</th>
                <th>最高价</th>
                <th>平均价</th>
                <th>加权均价</th>
                <th>最近价</th>
                <th>最近日期</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="col-supplier-wrap" title={row.supplier}>
                    {row.supplier}
                  </td>
                  <td>{row.record_count}</td>
                  <td>{fmtNum(row.min_price)}</td>
                  <td>{fmtNum(row.max_price)}</td>
                  <td>{fmtNum(row.avg_price)}</td>
                  <td>{fmtNum(row.weighted_avg_price)}</td>
                  <td>{fmtNum(row.latest_price)}</td>
                  <td>{row.latest_date}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-hint">
                    暂无厂家比价数据
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
