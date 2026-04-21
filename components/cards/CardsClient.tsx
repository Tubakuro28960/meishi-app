"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DeleteButton from "@/components/cards/DeleteButton";
import type { BusinessCard } from "@/types/database";

type SortKey = "created_at" | "name" | "company";
type SortDir = "asc" | "desc";

type Props = { cards: BusinessCard[] };

// メールが同じ、またはメールなしで氏名+会社名が同じものを重複とみなす
function buildDuplicateSet(cards: BusinessCard[]): Set<string> {
  const ids = new Set<string>();
  const emailMap = new Map<string, string[]>();
  const nameMap  = new Map<string, string[]>();

  for (const c of cards) {
    const email = c.email?.trim().toLowerCase();
    if (email) {
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)!.push(c.id);
    } else {
      const key = `${(c.name ?? "").trim()}|${(c.company ?? "").trim()}`.toLowerCase();
      if (key !== "|") {
        if (!nameMap.has(key)) nameMap.set(key, []);
        nameMap.get(key)!.push(c.id);
      }
    }
  }

  for (const list of [...emailMap.values(), ...nameMap.values()]) {
    if (list.length > 1) list.forEach(id => ids.add(id));
  }
  return ids;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "created_at", label: "登録日" },
  { key: "name",       label: "氏名" },
  { key: "company",    label: "会社名" },
];

export default function CardsClient({ cards }: Props) {
  const [query,           setQuery]           = useState("");
  const [sortKey,         setSortKey]         = useState<SortKey>("created_at");
  const [sortDir,         setSortDir]         = useState<SortDir>("desc");
  const [dupOnly,         setDupOnly]         = useState(false);

  const duplicates = useMemo(() => buildDuplicateSet(cards), [cards]);
  const dupCount   = duplicates.size;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = q
      ? cards.filter(c =>
          [c.name, c.company, c.email, c.phone, c.department, c.position]
            .some(v => v?.toLowerCase().includes(q))
        )
      : [...cards];

    if (dupOnly) list = list.filter(c => duplicates.has(c.id));

    list.sort((a, b) => {
      let va = (a[sortKey] ?? "").toString();
      let vb = (b[sortKey] ?? "").toString();
      // 日付はそのまま文字列比較（ISO形式なので正しく比較できる）
      // 氏名・会社名は読み仮名なしなのでロケール比較
      if (sortKey !== "created_at") {
        return sortDir === "asc"
          ? va.localeCompare(vb, "ja")
          : vb.localeCompare(va, "ja");
      }
      return sortDir === "asc"
        ? va.localeCompare(vb)
        : vb.localeCompare(va);
    });

    return list;
  }, [cards, query, sortKey, sortDir, dupOnly, duplicates]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" ? "desc" : "asc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span style={s.sortIconInactive}>↕</span>;
    return <span style={s.sortIconActive}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  if (cards.length === 0) {
    return (
      <div style={s.empty}>
        <p>まだ名刺が登録されていません。</p>
        <Link href="/cards/new" style={s.emptyLink}>最初の名刺を追加する</Link>
      </div>
    );
  }

  return (
    <div>
      {/* 検索・ソートバー */}
      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            type="search"
            placeholder="氏名・会社名・メールで検索…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={s.searchInput}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} style={s.clearBtn}>✕</button>
          )}
        </div>

        <div style={s.sortBar}>
          <span style={s.sortLabel}>並び替え:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => toggleSort(opt.key)}
              style={{ ...s.sortBtn, ...(sortKey === opt.key ? s.sortBtnActive : {}) }}
            >
              {opt.label} <SortIcon k={opt.key} />
            </button>
          ))}
        </div>

        {dupCount > 0 && (
          <button
            type="button"
            onClick={() => setDupOnly(d => !d)}
            style={{ ...s.dupToggle, ...(dupOnly ? s.dupToggleOn : {}) }}
          >
            ⚠ 重複 {dupCount} 件{dupOnly ? "（解除）" : "のみ表示"}
          </button>
        )}
      </div>

      {/* 件数 */}
      <p style={s.countLine}>
        {filtered.length} 件
        {query && <span style={s.countHint}> 「{query}」で絞り込み中</span>}
        {dupOnly && <span style={s.countHint}> ・重複のみ</span>}
      </p>

      {/* テーブル */}
      {filtered.length === 0 ? (
        <div style={s.noResult}>条件に一致する名刺がありません。</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>
                  <button type="button" onClick={() => toggleSort("name")} style={s.thBtn}>
                    氏名 <SortIcon k="name" />
                  </button>
                </th>
                <th style={s.th}>
                  <button type="button" onClick={() => toggleSort("company")} style={s.thBtn}>
                    会社名 <SortIcon k="company" />
                  </button>
                </th>
                <th style={s.th}>部署</th>
                <th style={s.th}>メールアドレス</th>
                <th style={s.th}>
                  <button type="button" onClick={() => toggleSort("created_at")} style={s.thBtn}>
                    登録日 <SortIcon k="created_at" />
                  </button>
                </th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(card => {
                const isDup = duplicates.has(card.id);
                return (
                  <tr key={card.id} style={{ ...s.tr, ...(isDup ? s.trDup : {}) }}>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        {card.name ?? "—"}
                        {isDup && (
                          <span style={s.dupBadge} title="同じメールアドレスまたは氏名+会社名の名刺が存在します">
                            重複
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={s.td}>{card.company ?? "—"}</td>
                    <td style={s.td}>{card.department ?? "—"}</td>
                    <td style={s.td}>
                      {card.email
                        ? <a href={`mailto:${card.email}`} style={s.emailLink}>{card.email}</a>
                        : "—"}
                    </td>
                    <td style={{ ...s.td, ...s.dateCell }}>
                      {new Date(card.created_at).toLocaleDateString("ja-JP")}
                    </td>
                    <td style={{ ...s.td, ...s.actionCell }}>
                      <Link href={`/cards/${card.id}`} style={s.detailBtn}>詳細</Link>
                      <Link href={`/cards/${card.id}/edit`} style={s.editBtn}>編集</Link>
                      <DeleteButton id={card.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  empty: {
    background: "#fff", borderRadius: 8, padding: "3rem",
    textAlign: "center", color: "#64748b",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  emptyLink: { display: "inline-block", marginTop: "1rem", color: "#2563eb", textDecoration: "underline" },

  toolbar: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "0.75rem",
  },

  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    padding: "0.375rem 0.625rem",
    flex: "1 1 220px",
    minWidth: 180,
    maxWidth: 360,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  searchIcon: { fontSize: "0.875rem", flexShrink: 0 },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "0.9375rem",
    background: "transparent",
    color: "#1e293b",
    minWidth: 0,
  },
  clearBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#94a3b8", fontSize: "0.8125rem", flexShrink: 0,
    padding: "0 0.125rem",
  },

  sortBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    flexWrap: "wrap",
  },
  sortLabel: { fontSize: "0.8125rem", color: "#64748b", flexShrink: 0 },
  sortBtn: {
    padding: "0.3rem 0.625rem",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    fontSize: "0.8125rem",
    color: "#475569",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  sortBtnActive: {
    background: "#eff6ff",
    border: "1px solid #93c5fd",
    color: "#1d4ed8",
    fontWeight: 600,
  },
  sortIconInactive: { color: "#cbd5e1", marginLeft: "0.125rem", fontSize: "0.75rem" },
  sortIconActive:   { color: "#2563eb", marginLeft: "0.125rem", fontSize: "0.75rem" },

  dupToggle: {
    padding: "0.3rem 0.75rem",
    background: "#fff",
    border: "1px solid #fcd34d",
    borderRadius: 4,
    fontSize: "0.8125rem",
    color: "#92400e",
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  dupToggleOn: {
    background: "#fef3c7",
    border: "1px solid #f59e0b",
  },

  countLine: { fontSize: "0.8125rem", color: "#64748b", marginBottom: "0.5rem" },
  countHint: { color: "#94a3b8" },

  noResult: {
    background: "#fff", borderRadius: 8, padding: "2rem",
    textAlign: "center", color: "#94a3b8",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },

  tableWrap: {
    background: "#fff", borderRadius: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "0.625rem 1rem", textAlign: "left",
    fontSize: "0.8125rem", fontWeight: 600, color: "#64748b",
    background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
  },
  thBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "0.8125rem", fontWeight: 600, color: "#64748b",
    padding: 0, display: "flex", alignItems: "center", gap: "0.25rem",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  trDup: { background: "#fffbeb" },
  td: { padding: "0.75rem 1rem", fontSize: "0.9375rem", color: "#1e293b", verticalAlign: "middle" },
  dateCell: { fontSize: "0.8125rem", color: "#64748b", whiteSpace: "nowrap" },
  actionCell: { whiteSpace: "nowrap", display: "flex", gap: "0.5rem", alignItems: "center" },

  nameCell: { display: "flex", alignItems: "center", gap: "0.5rem" },
  dupBadge: {
    fontSize: "0.6875rem", fontWeight: 700,
    background: "#fef3c7", color: "#b45309",
    border: "1px solid #fcd34d",
    borderRadius: 3, padding: "0.1rem 0.35rem",
    flexShrink: 0, cursor: "default",
  },

  emailLink: { color: "#2563eb", textDecoration: "none", fontSize: "0.9375rem" },

  detailBtn: { padding: "0.25rem 0.75rem", background: "#f1f5f9", color: "#1e3a5f", borderRadius: 4, fontSize: "0.8125rem" },
  editBtn:   { padding: "0.25rem 0.75rem", background: "#eff6ff", color: "#2563eb", borderRadius: 4, fontSize: "0.8125rem" },
};
