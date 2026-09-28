import { useEffect, useMemo, useState } from "react";
import AppShell, { type PageKey } from "./components/AppShell";
import { getBatches, type Batch } from "./api";
import ImportPage from "./pages/ImportPage";
import MaterialsPage from "./pages/MaterialsPage";
import PricesPage from "./pages/PricesPage";
import SuppliersPage from "./pages/SuppliersPage";
import ExportPage from "./pages/ExportPage";

export default function App() {
  const [page, setPage] = useState<PageKey>("数据导入");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  async function refreshBatches(preferredId?: number) {
    const data = await getBatches();
    setBatches(data);
    if (preferredId) {
      setSelectedBatchId(preferredId);
    } else if (data.length > 0) {
      setSelectedBatchId((current) => current ?? data[0].id);
    }
  }

  async function refreshAfterDelete(deletedId: number) {
    const data = await getBatches();
    setBatches(data);
    setSelectedBatchId((current) =>
      current === deletedId ? (data[0]?.id ?? null) : current,
    );
  }

  useEffect(() => {
    refreshBatches().catch((error) => {
      console.error(error);
    });
  }, []);

  const pageContent = useMemo(() => {
    const batchId = selectedBatchId ?? 0;
    switch (page) {
      case "数据导入":
        return (
          <ImportPage
            batches={batches}
            onImported={(id) => refreshBatches(id)}
            onDeleted={(id) => refreshAfterDelete(id)}
          />
        );
      case "材料归类":
        return <MaterialsPage batchId={batchId} />;
      case "历史价格":
        return <PricesPage batchId={batchId} />;
      case "厂家比价":
        return <SuppliersPage batchId={batchId} />;
      case "导出中心":
        return <ExportPage batchId={batchId} />;
      default:
        return null;
    }
  }, [page, selectedBatchId]);

  return (
    <AppShell
      active={page}
      batches={batches}
      selectedBatchId={selectedBatchId}
      onNavigate={setPage}
      onSelectBatch={setSelectedBatchId}
    >
      {pageContent}
    </AppShell>
  );
}
