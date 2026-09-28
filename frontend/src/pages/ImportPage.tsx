import { useRef, useState, type DragEvent } from "react";
import { deleteBatch, uploadBatch, type Batch } from "../api";
import { fmtDateTime } from "../utils";

interface ImportPageProps {
  batches: Batch[];
  onImported: (batchId: number) => Promise<void>;
  onDeleted: (deletedId: number) => Promise<void>;
}

export default function ImportPage({ batches, onImported, onDeleted }: ImportPageProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!/\.xlsx$/i.test(file.name)) {
      setError("只支持 .xlsx 文件");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const batch = await uploadBatch(file);
      setMessage(`导入完成，批次 ID：${batch.id}`);
      await onImported(batch.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  async function handleDelete(batch: Batch) {
    if (!window.confirm(`确定删除批次「${batch.file_name}」吗？删除后不可恢复。`)) {
      return;
    }
    setDeletingId(batch.id);
    setError("");
    setMessage("");
    try {
      await deleteBatch(batch.id);
      await onDeleted(batch.id);
      setMessage(`已删除批次 #${batch.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="stack">
      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          hidden
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <strong>{uploading ? "正在导入…" : "选择或拖入 Excel 文件"}</strong>
        <span className="muted">支持采购订单汇总 .xlsx 文件</span>
      </div>

      {error && <div className="error-box">{error}</div>}
      {message && <div className="success-box">{message}</div>}

      <div className="panel">
        <div className="panel-head">
          <h2>历史批次</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>批次 ID</th>
                <th>文件</th>
                <th>导入时间</th>
                <th>源数据行</th>
                <th>有效行</th>
                <th>未归类行</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td>{batch.id}</td>
                  <td>{batch.file_name}</td>
                  <td>{fmtDateTime(batch.imported_at)}</td>
                  <td>{batch.source_rows}</td>
                  <td>{batch.valid_rows}</td>
                  <td>{batch.unclassified_rows}</td>
                  <td>{batch.status}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-danger"
                      disabled={deletingId === batch.id}
                      onClick={() => handleDelete(batch)}
                    >
                      {deletingId === batch.id ? "删除中…" : "删除"}
                    </button>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-hint">
                    暂无导入批次
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
