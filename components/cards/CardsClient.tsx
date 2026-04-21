"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import Link from "next/link";
import DeleteButton from "@/components/cards/DeleteButton";
import { deleteCards } from "@/lib/actions/cards";
import type { BusinessCard } from "@/types/database";

type SortKey = "created_at" | "name" | "company";
type SortDir = "asc" | "desc";

type Props = { cards: BusinessCard[] };

type DupGroup = { key: string; cards: BusinessCard[] };

// メールが同じ、またはメールなしで氏名+会社名が同じものを重複とみなす
function buildDuplicates(cards: BusinessCard[]): {
  dupIds: Set<string>;
  groups: DupGroup[];
} {
  const emailMap = new Map<string, BusinessCard[]>();
  const nameMap  = new Map<string, BusinessCard[]>();

  for (const c of cards) {
    const email = c.email?.trim().toLowerCase();
    if (email) {
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)!.push(c);
    } else {
      const k = `${(c.name ?? "").trim()}|${(c.company ?? "").trim()}`.toLowerCase();
      if (k !== "|") {
        if (!nameMap.has(k)) nameMap.set(k, []);
        nameMap.get(k)!.push(c);
      }
    }
  }

  const groups: DupGroup[] = [];
  const dupIds = new Set<string>();

  for (const [key, list] of [...emailMap, ...nameMap]) {
    if (list.length <= 1) continue;
    // 新しい順に並べる
    const sorted = [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    groups.push({ key, cards: sorted });
    sorted.forEach(c => dupIds.add(c.id));
  }

  return { dupIds, groups };
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "created_at", label: "登録日" },
  { key: "name",       label: "氏名" },
  { key: "company",    label: "会社名" },
];

export default function CardsClient({ cards }: Props) {
  const [query,   setQuery]   = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dupOnly, setDupOnly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { dupIds, groups } = useMemo(() => buildDuplicates(cards), [cards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? cards.filter(c =>
          [c.name, c.company, c.email, c.phone, c.department, c.position]
            .some(v => v?.toLowerCase().includes(q))
        )
      : [...cards];

    if (dupOnly) list = list.filter(c => dupIds.has(c.id));

    list.sort((a, b) => {
      const va = (a[sortKey] ?? "").toString();
      const vb = (b[sortKey] ?? "").toString();
      if (sortKey !== "created_at") {
        return sortDir === "asc" ? va.localeCompare(vb, "ja") : vb.localeCompare(va, "ja");
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return list;
  }, [cards, query, sortKey, sortDir, dupOnly, dupIds]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" ? "desc" : "asc");
    }
  }

  // 指定グループの「最新1件を残して他を削除」
  function handleDeleteDups(group: DupGroup) {
    const toDelete = group.cards.slice(1).map(c => c.id); // 先頭（最新）以外
    if (!confirm(`「${group.cards[0].name ?? group.cards[0].email ?? "この名刺"}」を1件残して、残り${toDelete.length}件を削除しますか？`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCards(toDelete);
      if (result?.error) setDeleteError(result.error);
    });
  }

  // 全グループの重複をまとめて解消
  function handleDeleteAllDups() {
    const toDelete = groups.flatMap(g => g.cards.slice(1).map(c => c.id));
    if (!confirm(`全 ${groups.length} グループの重複を解消します（各グループの最新1件を残して合計 ${toDelete.length} 件削除）。よろしいですか？`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCards(toDelete);
      if (result?.error) setDeleteError(result.error);
      else setDupOnly(false);
    });
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span style={s.sortIconOff}>↕</span>;
    return <span style={s.sortIconOn}>{sortDir === "asc" ? "↑" : "↓"}</span>;
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
      {/* ツールバー */}
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

        {dupIds.size > 0 && (
          <button
            type="button"
            onClick={() => { setDupOnly(d => !d); setQuery(""); }}
            style={{ ...s.dupToggle, ...(dupOnly ? s.dupToggleOn : {}) }}
          >
            ⚠ 重複 {dupIds.size} 件{dupOnly ? "（解除）" : "のみ表示"}
          </button>
        )}
      </div>

      {deleteError && <p style={s.errorMsg}>{deleteError}</p>}

      {/* 重複グループ表示 */}
      {dupOnly && groups.length > 0 && (
        <div style={s.dupSection}>
          <div style={s.dupSectionHeader}>
            <div>
              <p style={s.dupSectionTitle}>⚠ 重複グループ（{groups.length} グループ）</p>
              <p style={s.dupSectionSub}>各グループの一番上（最新登録）が残り、下の名刺が削除対象です</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAllDups}
              disabled={isPending}
              style={s.deleteAllBtn}
            >
              {isPending ? "削除中…" : "全重複をまとめて解消"}
            </button>
          </div>

          {groups.map((group, gi) => (
            <div key={gi} style={s.dupGroup}>
              <div style={s.dupGroupHeader}>
                <span style={s.dupGroupLabel}>
                  {group.cards[0].email
                    ? `メール: ${group.cards[0].email}`
                    : `氏名+会社: ${group.cards[0].name ?? ""}  ${group.cards[0].company ?? ""}`}
                </span>
                <span style={s.dupGroupCount}>{group.cards.length} 件</span>
                <button
                  type="button"
                  onClick={() => handleDeleteDups(group)}
                  disabled={isPending}
                  style={s.deleteGroupBtn}
                >
                  最新1件を残して削除
                </button>
              </div>

              <div style={s.dupGroupCards}>
                {group.cards.map((card, ci) => (
                  <div key={card.id} style={{ ...s.dupCard, ...(ci === 0 ? s.dupCardKeep : s.dupCardRemove) }}>
                    <div style={s.dupCardBadge}>
                      {ci === 0
                        ? <span style={s.keepBadge}>残す</span>
                        : <span style={s.removeBadge}>削除対象</span>
                      }
                    </div>
                    <div style={s.dupCardInfo}>
                      <span style={s.dupCardName}>{card.name ?? "—"}</span>
                      <span style={s.dupCardSub}>{[card.company, card.department].filter(Boolean).join(" / ") || "—"}</span>
                      <span style={s.dupCardEmail}>{card.email ?? "—"}</span>
                    </div>
                    <div style={s.dupCardMeta}>
                      <span style={s.dupCardDate}>{new Date(card.created_at).toLocaleDateString("ja-JP")}</span>
                      <div style={s.dupCardActions}>
                        <Link href={`/cards/${card.id}`} style={s.detailBtn}>詳細</Link>
                        <DeleteButton id={card.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 通常リスト */}
      {!dupOnly && (
        <>
          <p style={s.countLine}>
            {filtered.length} 件
            {query && <span style={s.countHint}> 「{query}」で絞り込み中</span>}
          </p>

          {filtered.length === 0 ? (
            <div style={s.noResult}>条件に一致する名刺がありません。</div>
          ) : isMobile ? (
            /* ── モバイル: カード型レイアウト ── */
            <div style={s.mobileList}>
              {filtered.map(card => {
                const isDup = dupIds.has(card.id);
                return (
                  <div key={card.id} className="list-item card-hover" style={{ ...s.mobileCard, ...(isDup ? s.mobileCardDup : {}) }}>
                    <div style={s.mobileCardTop}>
                      <div style={s.mobileNameRow}>
                        <span style={s.mobileName}>{card.name ?? "—"}</span>
                        {isDup && <span style={s.dupBadge}>重複</span>}
                      </div>
                      <Link href={`/cards/${card.id}`} style={s.mobileDetailBtn}>詳細</Link>
                    </div>
                    <p style={s.mobileCompany}>
                      {[card.company, card.department].filter(Boolean).join(" / ") || "—"}
                    </p>
                    {card.email && (
                      <a href={`mailto:${card.email}`} style={s.mobileEmail}>{card.email}</a>
                    )}
                    <div style={s.mobileBottom}>
                      <span style={s.mobileDate}>{new Date(card.created_at).toLocaleDateString("ja-JP")}</span>
                      <div style={s.mobileActions}>
                        <Link href={`/cards/${card.id}/edit`} style={s.editBtn}>編集</Link>
                        <DeleteButton id={card.id} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── デスクトップ: テーブル ── */
            <div className="table-scroll" style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}><button type="button" onClick={() => toggleSort("name")} style={s.thBtn}>氏名 <SortIcon k="name" /></button></th>
                    <th style={s.th}><button type="button" onClick={() => toggleSort("company")} style={s.thBtn}>会社名 <SortIcon k="company" /></button></th>
                    <th style={s.th}>部署</th>
                    <th style={s.th}>メールアドレス</th>
                    <th style={s.th}><button type="button" onClick={() => toggleSort("created_at")} style={s.thBtn}>登録日 <SortIcon k="created_at" /></button></th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(card => {
                    const isDup = dupIds.has(card.id);
                    return (
                      <tr key={card.id} style={{ ...s.tr, ...(isDup ? s.trDup : {}) }}>
                        <td style={s.td}>
                          <div style={s.nameCell}>
                            {card.name ?? "—"}
                            {isDup && <span style={s.dupBadge} title="重複あり">重複</span>}
                          </div>
                        </td>
                        <td style={s.td}>{card.company ?? "—"}</td>
                        <td style={s.td}>{card.department ?? "—"}</td>
                        <td style={s.td}>
                          {card.email ? <a href={`mailto:${card.email}`} style={s.emailLink}>{card.email}</a> : "—"}
                        </td>
                        <td style={{ ...s.td, ...s.dateCell }}>{new Date(card.created_at).toLocaleDateString("ja-JP")}</td>
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
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  empty: { background: "#fff", borderRadius: 8, padding: "3rem", textAlign: "center", color: "#64748b", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  emptyLink: { display: "inline-block", marginTop: "1rem", color: "#2563eb", textDecoration: "underline" },

  toolbar: { display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.75rem" },

  searchWrap: { display: "flex", alignItems: "center", gap: "0.375rem", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "0.375rem 0.625rem", flex: "1 1 220px", minWidth: 180, maxWidth: 360, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  searchIcon: { fontSize: "0.875rem", flexShrink: 0 },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "0.9375rem", background: "transparent", color: "#1e293b", minWidth: 0 },
  clearBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "0.8125rem", flexShrink: 0, padding: "0 0.125rem" },

  sortBar: { display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" },
  sortLabel: { fontSize: "0.8125rem", color: "#64748b", flexShrink: 0 },
  sortBtn: { padding: "0.3rem 0.625rem", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: "0.8125rem", color: "#475569", cursor: "pointer", whiteSpace: "nowrap" },
  sortBtnActive: { background: "#eff6ff", border: "1px solid #93c5fd", color: "#1d4ed8", fontWeight: 600 },
  sortIconOff: { color: "#cbd5e1", marginLeft: "0.125rem", fontSize: "0.75rem" },
  sortIconOn:  { color: "#2563eb", marginLeft: "0.125rem", fontSize: "0.75rem" },

  dupToggle: { padding: "0.3rem 0.75rem", background: "#fff", border: "1px solid #fcd34d", borderRadius: 4, fontSize: "0.8125rem", color: "#92400e", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" },
  dupToggleOn: { background: "#fef3c7", border: "1px solid #f59e0b" },

  errorMsg: { color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.75rem" },

  // 重複セクション
  dupSection: { display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" },
  dupSectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" },
  dupSectionTitle: { fontSize: "1rem", fontWeight: 700, color: "#92400e" },
  dupSectionSub: { fontSize: "0.8125rem", color: "#78716c", marginTop: "0.125rem" },
  deleteAllBtn: { padding: "0.5rem 1.25rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },

  dupGroup: { background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #fcd34d" },
  dupGroupHeader: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "#fef9c3", flexWrap: "wrap" },
  dupGroupLabel: { flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "#78350f", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dupGroupCount: { fontSize: "0.8125rem", color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 20, padding: "0.1rem 0.5rem", fontWeight: 600, flexShrink: 0 },
  deleteGroupBtn: { padding: "0.35rem 0.875rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 },

  dupGroupCards: { display: "flex", flexDirection: "column" },
  dupCard: { display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" },
  dupCardKeep:   { background: "#f0fdf4" },
  dupCardRemove: { background: "#fff" },
  dupCardBadge:  { flexShrink: 0, width: 60 },
  keepBadge:   { fontSize: "0.75rem", fontWeight: 700, color: "#16a34a", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 3, padding: "0.1rem 0.4rem" },
  removeBadge: { fontSize: "0.75rem", fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 3, padding: "0.1rem 0.4rem" },
  dupCardInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "0.125rem", minWidth: 0 },
  dupCardName:  { fontSize: "0.9375rem", fontWeight: 600, color: "#1e293b" },
  dupCardSub:   { fontSize: "0.8125rem", color: "#64748b" },
  dupCardEmail: { fontSize: "0.8125rem", color: "#2563eb" },
  dupCardMeta:  { display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 },
  dupCardDate:  { fontSize: "0.8125rem", color: "#94a3b8", whiteSpace: "nowrap" },
  dupCardActions: { display: "flex", gap: "0.375rem" },

  countLine: { fontSize: "0.8125rem", color: "#64748b", marginBottom: "0.5rem" },
  countHint: { color: "#94a3b8" },
  noResult: { background: "#fff", borderRadius: 8, padding: "2rem", textAlign: "center", color: "#94a3b8", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },

  tableWrap: { background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "0.625rem 1rem", textAlign: "left", fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  thBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", padding: 0, display: "flex", alignItems: "center", gap: "0.25rem" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  trDup: { background: "#fffbeb" },
  td: { padding: "0.75rem 1rem", fontSize: "0.9375rem", color: "#1e293b", verticalAlign: "middle" },
  dateCell: { fontSize: "0.8125rem", color: "#64748b", whiteSpace: "nowrap" },
  actionCell: { whiteSpace: "nowrap", display: "flex", gap: "0.5rem", alignItems: "center" },

  nameCell: { display: "flex", alignItems: "center", gap: "0.5rem" },
  dupBadge: { fontSize: "0.6875rem", fontWeight: 700, background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d", borderRadius: 3, padding: "0.1rem 0.35rem", flexShrink: 0 },
  emailLink: { color: "#2563eb", textDecoration: "none" },
  detailBtn: { padding: "0.25rem 0.75rem", background: "#f1f5f9", color: "#1e3a5f", borderRadius: 4, fontSize: "0.8125rem" },
  editBtn:   { padding: "0.25rem 0.75rem", background: "#eff6ff", color: "#2563eb", borderRadius: 4, fontSize: "0.8125rem" },

  // モバイル用カードレイアウト
  mobileList:      { display: "flex", flexDirection: "column", gap: "0.625rem" },
  mobileCard:      { background: "#fff", borderRadius: 12, padding: "1rem 1.125rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)", border: "none" },
  mobileCardDup:   { background: "#fffbeb", border: "1px solid #fcd34d" },
  mobileCardTop:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" },
  mobileNameRow:   { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" },
  mobileName:      { fontWeight: 700, fontSize: "1rem", color: "#1e293b" },
  mobileDetailBtn: { padding: "0.25rem 0.75rem", background: "#f1f5f9", color: "#1e3a5f", borderRadius: 4, fontSize: "0.8125rem", flexShrink: 0 },
  mobileCompany:   { fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" },
  mobileEmail:     { fontSize: "0.875rem", color: "#2563eb", display: "block", marginBottom: "0.5rem", wordBreak: "break-all" },
  mobileBottom:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" },
  mobileDate:      { fontSize: "0.75rem", color: "#94a3b8" },
  mobileActions:   { display: "flex", gap: "0.5rem", alignItems: "center" },
};
