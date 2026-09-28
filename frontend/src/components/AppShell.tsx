import type { ReactNode } from "react";
import type { Batch } from "../api";

export type PageKey =
  | "数据导入"
  | "材料归类"
  | "历史价格"
  | "厂家比价"
  | "导出中心";

const NAV: PageKey[] = [
  "数据导入",
  "材料归类",
  "历史价格",
  "厂家比价",
  "导出中心",
];

interface AppShellProps {
  active: PageKey;
  batches: Batch[];
  selectedBatchId: number | null;
  onNavigate: (page: PageKey) => void;
  onSelectBatch: (batchId: number) => void;
  children: ReactNode;
}

export default function AppShell({
  active,
  batches,
  selectedBatchId,
  onNavigate,
  onSelectBatch,
  children,
}: AppShellProps) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">材料分析系统</div>
        <nav className="nav">
          {NAV.map((item) => (
            <button
              key={item}
              type="button"
              className={`nav-item ${item === active ? "active" : ""}`}
              onClick={() => onNavigate(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <div className="content">
        <header className="topbar">
          <div>
            <h1 className="page-title">{active}</h1>
            <p className="page-subtitle">采购订单材料归组、比价与导出</p>
          </div>
          <label className="batch-picker">
            <span>当前批次</span>
            <select
              value={selectedBatchId ?? ""}
              onChange={(event) => onSelectBatch(Number(event.target.value))}
            >
              <option value="" disabled>
                请选择批次
              </option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  #{batch.id} · {batch.file_name}
                </option>
              ))}
            </select>
          </label>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
