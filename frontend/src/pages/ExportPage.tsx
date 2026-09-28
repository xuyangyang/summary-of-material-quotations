import { exportUrl } from "../api";

const ITEMS: Array<{
  type: "materials" | "prices" | "suppliers";
  title: string;
  description: string;
}> = [
  { type: "materials", title: "材料归类", description: "标准材料名称、规格、记录数、总采购量、总金额" },
  { type: "prices", title: "历史价格", description: "材料、规格、采购日期、供应商、单价、金额" },
  { type: "suppliers", title: "厂家价格", description: "厂家、最低价、最高价、平均价、最近价" },
];

export default function ExportPage({ batchId }: { batchId: number }) {
  return (
    <section className="stack">
      {!batchId && <div className="error-box">请先选择批次再导出</div>}
      <div className="panel">
        <div className="panel-head">
          <h2>导出中心</h2>
          <span className="muted">当前批次：{batchId || "未选择"}</span>
        </div>
        <div className="export-grid">
          {ITEMS.map((item) => (
            <a
              key={item.type}
              className="export-card"
              href={batchId ? exportUrl(batchId, item.type) : undefined}
              download
              aria-disabled={!batchId}
            >
              <strong>{item.title}</strong>
              <span>{item.description}</span>
              <em>下载 Excel</em>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
