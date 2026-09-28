import { useEffect, useMemo, useState } from "react";
import {
  getGroupRecords,
  getGroups,
  search,
  type MaterialGroup,
  type MaterialRecord,
  type SearchParams,
} from "../api";
import { fmtNum } from "../utils";

type SortKey =
  | "material_name"
  | "spec"
  | "record_count"
  | "total_quantity"
  | "total_amount";

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: "material_name", label: "标准材料名称" },
  { key: "spec", label: "标准规格" },
  { key: "record_count", label: "记录数" },
  { key: "total_quantity", label: "总采购量" },
  { key: "total_amount", label: "总金额" },
];

const EMPTY_SEARCH: SearchParams = {
  project: "",
  supplier: "",
  date_from: "",
  date_to: "",
  category: "",
  spec: "",
  material_name: "",
  match_mode: "fuzzy",
};

interface DetailFilters {
  project: string;
  supplier: string;
  date_from: string;
  date_to: string;
}

const EMPTY_DETAIL_FILTERS: DetailFilters = {
  project: "",
  supplier: "",
  date_from: "",
  date_to: "",
};

function ClearableInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="clearable-input">
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className="input-clear"
          aria-label="清空"
          onClick={() => onChange("")}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function MaterialsPage({ batchId }: { batchId: number }) {
  const [groups, setGroups] = useState<MaterialGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("record_count");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [records, setRecords] = useState<MaterialRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [detailPage, setDetailPage] = useState(0);
  const [detailFilters, setDetailFilters] = useState<DetailFilters>({ ...EMPTY_DETAIL_FILTERS });
  const [groupPage, setGroupPage] = useState(0);
  const groupPageSize = 100;

  const [searchParams, setSearchParams] = useState<SearchParams>({ ...EMPTY_SEARCH });
  const [searchRecords, setSearchRecords] = useState<MaterialRecord[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (!batchId) {
      setGroups([]);
      return;
    }
    setLoading(true);
    setError("");
    getGroups(batchId)
      .then(setGroups)
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [batchId]);

  useEffect(() => {
    setGroupPage(0);
  }, [batchId, searchRecords, sortKey, sortAsc]);

  function setSearch<K extends keyof SearchParams>(key: K, value: SearchParams[K]) {
    setSearchParams((current) => ({ ...current, [key]: value }));
  }

  async function runSearch() {
    if (!batchId) {
      setSearchError("请先选择批次");
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const result = await search(batchId, searchParams);
      setSearchRecords(result.records);
      setExpandedId(null);
      setRecords([]);
      setDetailPage(0);
      setDetailFilters({ ...EMPTY_DETAIL_FILTERS });
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "搜索失败");
    } finally {
      setSearching(false);
    }
  }

  function resetSearch() {
    setSearchParams({ ...EMPTY_SEARCH });
    setSearchRecords(null);
    setSearchError("");
    setExpandedId(null);
    setRecords([]);
    setDetailPage(0);
    setDetailFilters({ ...EMPTY_DETAIL_FILTERS });
  }

  async function toggle(group: MaterialGroup) {
    if (expandedId === group.id) {
      setExpandedId(null);
      setRecords([]);
      setDetailPage(0);
      setDetailFilters({ ...EMPTY_DETAIL_FILTERS });
      return;
    }

    setExpandedId(group.id);
    setDetailPage(0);
    setRecords([]);
    setDetailFilters({ ...EMPTY_DETAIL_FILTERS });

    setLoadingRecords(true);
    try {
      setRecords(await getGroupRecords(batchId, group.id));
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : "加载记录失败");
    } finally {
      setLoadingRecords(false);
    }
  }

  const matchedGroupIds = useMemo(() => {
    if (!searchRecords) {
      return null;
    }
    return new Set(searchRecords.map((record) => record.group_id).filter(Boolean) as number[]);
  }, [searchRecords]);

  const visibleGroups = useMemo(() => {
    if (matchedGroupIds) {
      return groups.filter((group) => matchedGroupIds.has(group.id));
    }
    return groups;
  }, [groups, matchedGroupIds]);

  const sorted = useMemo(
    () =>
      [...visibleGroups].sort((a, b) => {
        const left = a[sortKey];
        const right = b[sortKey];
        if (typeof left === "number" && typeof right === "number") {
          return sortAsc ? left - right : right - left;
        }
        return sortAsc
          ? String(left).localeCompare(String(right), "zh-CN")
          : String(right).localeCompare(String(left), "zh-CN");
      }),
    [visibleGroups, sortKey, sortAsc],
  );

  const totalGroupPages = Math.max(1, Math.ceil(sorted.length / groupPageSize));
  const pagedGroups = sorted.slice(
    groupPage * groupPageSize,
    (groupPage + 1) * groupPageSize,
  );

  function setSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((value) => !value);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function setDetailFilter<K extends keyof DetailFilters>(key: K, value: DetailFilters[K]) {
    setDetailFilters((current) => ({ ...current, [key]: value }));
    setDetailPage(0);
  }

  return (
    <section className="stack">
      <div className="panel filters">
        <div className="filter-grid">
          <label>
            <span>材料名称</span>
            <ClearableInput
              value={searchParams.material_name}
              onChange={(value) => setSearch("material_name", value)}
              placeholder="支持 AI 语义匹配"
            />
          </label>
          <label>
            <span>匹配方式</span>
            <select
              value={searchParams.match_mode}
              onChange={(event) =>
                setSearch("match_mode", event.target.value as SearchParams["match_mode"])
              }
            >
              <option value="fuzzy">模糊</option>
              <option value="exact">精确</option>
              <option value="ai">AI 语义</option>
            </select>
          </label>
          <label>
            <span>标准规格</span>
            <ClearableInput
              value={searchParams.spec}
              onChange={(value) => setSearch("spec", value)}
              placeholder="如 DN100"
            />
          </label>
          <div className="filter-actions">
            <button type="button" className="btn-primary" onClick={runSearch} disabled={searching}>
              {searching ? "搜索中…" : "搜索"}
            </button>
            <button type="button" className="btn-secondary" onClick={resetSearch}>
              重置
            </button>
          </div>
        </div>
      </div>

      {searchError && <div className="error-box">{searchError}</div>}
      {error && <div className="error-box">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <h2>材料归类</h2>
          <span className="muted">
            {searchRecords ? `匹配 ${sorted.length} 组 / ${searchRecords.length} 条` : `${sorted.length} 组`}
          </span>
        </div>
        <div className="detail-pagination top">
          <span>
            第 {groupPage + 1} / {totalGroupPages} 页，共 {sorted.length} 组
          </span>
          <div className="detail-pagination-actions">
            <button
              type="button"
              disabled={groupPage <= 0}
              onClick={() => setGroupPage(Math.max(0, groupPage - 1))}
            >
              上一页
            </button>
            <button
              type="button"
              disabled={groupPage >= totalGroupPages - 1}
              onClick={() => setGroupPage(Math.min(totalGroupPages - 1, groupPage + 1))}
            >
              下一页
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th />
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={`sortable ${sortKey === column.key ? "active" : ""}`}
                    onClick={() => setSort(column.key)}
                  >
                    {column.label}
                    {sortKey === column.key ? (sortAsc ? " ↑" : " ↓") : ""}
                  </th>
                ))}
                <th>分类</th>
                <th>单位</th>
              </tr>
            </thead>
            <tbody>
              {pagedGroups.map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  expanded={expandedId === group.id}
                  records={expandedId === group.id ? records : []}
                  loading={expandedId === group.id && loadingRecords}
                  page={detailPage}
                  pageSize={50}
                  onPageChange={setDetailPage}
                  detailFilters={detailFilters}
                  onDetailFilterChange={setDetailFilter}
                  onToggle={() => toggle(group)}
                />
              ))}
              {pagedGroups.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-hint">
                    {loading ? "加载中…" : "暂无符合条件的材料"}
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

function GroupRow({
  group,
  expanded,
  records,
  loading,
  page,
  pageSize,
  onPageChange,
  detailFilters,
  onDetailFilterChange,
  onToggle,
}: {
  group: MaterialGroup;
  expanded: boolean;
  records: MaterialRecord[];
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  detailFilters: DetailFilters;
  onDetailFilterChange: <K extends keyof DetailFilters>(
    key: K,
    value: DetailFilters[K],
  ) => void;
  onToggle: () => void;
}) {
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const project = detailFilters.project.trim();
      const supplier = detailFilters.supplier.trim();
      const from = detailFilters.date_from;
      const to = detailFilters.date_to;
      if (project && !record.project.includes(project)) {
        return false;
      }
      if (supplier && !record.supplier.includes(supplier)) {
        return false;
      }
      if (from && record.purchase_date < from) {
        return false;
      }
      if (to && record.purchase_date > to) {
        return false;
      }
      return true;
    });
  }, [records, detailFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const visibleRecords = filteredRecords.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <>
      <tr
        key={`row-${group.id}`}
        className={`row-clickable ${expanded ? "row-expanded" : ""}`}
        onClick={onToggle}
        title={expanded ? "收起明细" : "展开明细"}
        data-expanded={expanded ? "true" : "false"}
      >
        <td>
          <button
            type="button"
            className={`chevron ${expanded ? "open" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            aria-label={expanded ? "收起明细" : "展开明细"}
          >
            ▸
          </button>
        </td>
        <td>{group.material_name}</td>
        <td>{group.spec}</td>
        <td>{group.record_count}</td>
        <td>{fmtNum(group.total_quantity)}</td>
        <td>{fmtNum(group.total_amount)}</td>
        <td>{group.categories}</td>
        <td>{group.units}</td>
      </tr>
      {expanded && (
        <tr key={`detail-${group.id}`} className="detail-row" data-detail="true">
          <td colSpan={8}>
            <div className="details-panel">
              <div className="details-head">
                <strong>
                  {group.material_name}
                  {group.spec ? ` · ${group.spec}` : ""}
                </strong>
                <span>
                  显示 {filteredRecords.length} / 共 {records.length} 条
                </span>
              </div>
              <div className="detail-filters">
                <label>
                  <span>项目</span>
                  <ClearableInput
                    value={detailFilters.project}
                    onChange={(value) => onDetailFilterChange("project", value)}
                    placeholder="筛选项目"
                  />
                </label>
                <label>
                  <span>供应商</span>
                  <ClearableInput
                    value={detailFilters.supplier}
                    onChange={(value) => onDetailFilterChange("supplier", value)}
                    placeholder="筛选供应商"
                  />
                </label>
                <label>
                  <span>开始日期</span>
                  <ClearableInput
                    type="date"
                    value={detailFilters.date_from}
                    onChange={(value) => onDetailFilterChange("date_from", value)}
                  />
                </label>
                <label>
                  <span>结束日期</span>
                  <ClearableInput
                    type="date"
                    value={detailFilters.date_to}
                    onChange={(value) => onDetailFilterChange("date_to", value)}
                  />
                </label>
              </div>
              {!loading && filteredRecords.length > 0 && (
                <div className="detail-pagination top">
                  <span>
                    第 {page + 1} / {totalPages} 页，共 {filteredRecords.length} 条
                  </span>
                  <div className="detail-pagination-actions">
                    <button
                      type="button"
                      disabled={page <= 0}
                      onClick={() => onPageChange(Math.max(0, page - 1))}
                    >
                      上一页
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages - 1}
                      onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
              {loading ? (
                <div className="details-loading">正在加载采购明细…</div>
              ) : filteredRecords.length === 0 ? (
                <div className="details-loading">暂无符合条件的采购明细</div>
              ) : (
                <div className="table-wrap inner">
                  <table>
                    <thead>
                      <tr>
                        <th>供应商</th>
                        <th>采购日期</th>
                        <th>原始材料</th>
                        <th>原始规格</th>
                        <th>单价</th>
                        <th>采购量</th>
                        <th>金额</th>
                        <th>项目</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.supplier}</td>
                          <td>{record.purchase_date}</td>
                          <td>{record.raw_material}</td>
                          <td>{record.raw_spec}</td>
                          <td>{fmtNum(record.unit_price)}</td>
                          <td>{fmtNum(record.quantity)}</td>
                          <td>{fmtNum(record.amount)}</td>
                          <td>{record.project}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
