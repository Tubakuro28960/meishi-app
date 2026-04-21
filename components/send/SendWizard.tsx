"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { renderTemplate } from "@/lib/templates/render";
import { buildMailtoUrl } from "@/lib/send/mailto";
import { recordImmediateJobs } from "@/lib/actions/send";
import type { BusinessCard, Template } from "@/types/database";

type Props = { cards: BusinessCard[]; templates: Template[] };
type Preview = { card: BusinessCard; subject: string; body: string };

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["名刺選択", "テンプレート", "プレビュー・送信"];
  return (
    <div style={s.stepper}>
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = n === step;
        const done = n < step;
        return (
          <div key={n} style={s.stepItem}>
            <div style={{ ...s.stepCircle, ...(active ? s.stepActive : done ? s.stepDone : s.stepIdle) }}>
              {done ? "✓" : n}
            </div>
            <span style={{ ...s.stepLabel, ...(active ? s.stepLabelActive : {}) }}>{label}</span>
            {i < 2 && <div style={s.stepLine} />}
          </div>
        );
      })}
    </div>
  );
}

function Step1({ cards, selectedIds, onToggle, onNext }: {
  cards: BusinessCard[]; selectedIds: Set<string>;
  onToggle: (id: string) => void; onNext: () => void;
}) {
  const cardsWithEmail = cards.filter(c => c.email);
  const cardsNoEmail   = cards.filter(c => !c.email);
  return (
    <div>
      <h2 style={s.stepTitle}>名刺を選択してください</h2>
      <p style={s.stepDesc}>メールアドレスが登録されている名刺のみ送信できます。</p>
      {cardsWithEmail.length === 0 && cardsNoEmail.length === 0 && (
        <p style={s.empty}>名刺が登録されていません。先に名刺を追加してください。</p>
      )}
      {cardsWithEmail.length > 0 && (
        <div style={s.cardList}>
          {cardsWithEmail.map(card => {
            const checked = selectedIds.has(card.id);
            return (
              <label key={card.id} style={{ ...s.cardRow, ...(checked ? s.cardRowChecked : {}) }}>
                <input type="checkbox" checked={checked} onChange={() => onToggle(card.id)} style={s.checkbox} />
                <div style={s.cardInfo}>
                  <span style={s.cardName}>{card.name ?? "（氏名なし）"}</span>
                  <span style={s.cardCompany}>{card.company ?? "—"}</span>
                  <span style={s.cardEmail}>{card.email}</span>
                </div>
              </label>
            );
          })}
        </div>
      )}
      {cardsNoEmail.length > 0 && (
        <>
          <p style={s.noEmailLabel}>メールアドレスなし（送信不可）</p>
          <div style={s.cardList}>
            {cardsNoEmail.map(card => (
              <div key={card.id} style={{ ...s.cardRow, ...s.cardRowDisabled }}>
                <input type="checkbox" disabled style={s.checkbox} />
                <div style={s.cardInfo}>
                  <span style={s.cardName}>{card.name ?? "（氏名なし）"}</span>
                  <span style={s.cardCompany}>{card.company ?? "—"}</span>
                  <span style={{ ...s.cardEmail, color: "#fca5a5" }}>メールアドレス未登録</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={s.stepActions}>
        <span style={s.selCount}>{selectedIds.size} 件選択中</span>
        <button onClick={onNext} disabled={selectedIds.size === 0}
          style={{ ...s.btnPrimary, ...(selectedIds.size === 0 ? s.btnDisabled : {}) }}>
          次へ →
        </button>
      </div>
    </div>
  );
}

function Step2({ templates, selectedId, onSelect, onBack, onNext }: {
  templates: Template[]; selectedId: string | null;
  onSelect: (id: string) => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <div>
      <h2 style={s.stepTitle}>テンプレートを選択してください</h2>
      {templates.length === 0 && (
        <p style={s.empty}>テンプレートが登録されていません。先にテンプレートを作成してください。</p>
      )}
      <div style={s.tmplList}>
        {templates.map(tmpl => {
          const checked = selectedId === tmpl.id;
          return (
            <label key={tmpl.id} style={{ ...s.tmplRow, ...(checked ? s.tmplRowChecked : {}) }}>
              <input type="radio" name="template" checked={checked} onChange={() => onSelect(tmpl.id)} style={s.radio} />
              <div style={s.tmplInfo}>
                <div style={s.tmplNameRow}>
                  <span style={s.tmplName}>{tmpl.name}</span>
                  {tmpl.is_default && <span style={s.badge}>デフォルト</span>}
                </div>
                <span style={s.tmplSubject}>件名: {tmpl.subject_template || "（未設定）"}</span>
              </div>
            </label>
          );
        })}
      </div>
      <div style={s.stepActions}>
        <button onClick={onBack} style={s.btnSecondary}>← 戻る</button>
        <button onClick={onNext} disabled={!selectedId || templates.length === 0}
          style={{ ...s.btnPrimary, ...(!selectedId || templates.length === 0 ? s.btnDisabled : {}) }}>
          次へ →
        </button>
      </div>
    </div>
  );
}

function Step3({ previews, onBack, onRecord, recording, recordError }: {
  previews: Preview[]; onBack: () => void;
  onRecord: () => void; recording: boolean; recordError: string | null;
}) {
  const anchorRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  function handleOpenAll() {
    previews.forEach((_, i) => {
      setTimeout(() => { anchorRefs.current[i]?.click(); }, i * 700);
    });
  }

  return (
    <div>
      <h2 style={s.stepTitle}>送信内容を確認してください</h2>
      <div style={s.previewList}>
        {previews.map((p, i) => {
          const url = buildMailtoUrl(p.card.email!, p.subject, p.body);
          return (
            <div key={p.card.id} style={s.previewCard}>
              <div style={s.previewHeader}>
                <div>
                  <span style={s.previewName}>{p.card.name ?? "（氏名なし）"}</span>
                  <span style={s.previewTo}>宛先: {p.card.email}</span>
                </div>
                <a ref={el => { anchorRefs.current[i] = el; }} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "none" }} aria-hidden>hidden</a>
                <a href={url} target="_blank" rel="noopener noreferrer" style={s.openBtn}>✉ メールアプリを開く</a>
              </div>
              <div style={s.previewBody}>
                <div style={s.previewField}>
                  <span style={s.fieldKey}>件名</span>
                  <span style={s.fieldVal}>{p.subject || "（空）"}</span>
                </div>
                <div style={s.previewField}>
                  <span style={{ ...s.fieldKey, alignSelf: "flex-start" }}>本文</span>
                  <pre style={s.previewText}>{p.body || "（空）"}</pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {previews.length > 1 && (
        <div style={s.openAllBox}>
          <button onClick={handleOpenAll} style={s.openAllBtn}>全 {previews.length} 件を順番に開く</button>
          <p style={s.popupWarn}>※ ブラウザのポップアップブロックが有効だと2件目以降が開かない場合があります。</p>
        </div>
      )}
      {recordError && <p style={s.errorMsg}>{recordError}</p>}
      <div style={s.stepActions}>
        <button onClick={onBack} style={s.btnSecondary} disabled={recording}>← 戻る</button>
        <button onClick={onRecord} style={s.btnSuccess} disabled={recording}>
          {recording ? "処理中..." : `送信完了 (${previews.length} 件)`}
        </button>
      </div>
    </div>
  );
}

export default function SendWizard({ cards, templates }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    templates.find(t => t.is_default)?.id ?? templates[0]?.id ?? null
  );
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  function toggleCard(id: string) {
    setSelectedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const selectedCards   = cards.filter(c => selectedCardIds.has(c.id));
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) ?? null;

  const previews: Preview[] = selectedCards.filter(c => c.email).map(card => {
    const vars = { name: card.name, company: card.company, department: card.department, position: card.position, email: card.email, sender_name: null };
    return { card, subject: selectedTemplate ? renderTemplate(selectedTemplate.subject_template, vars) : "", body: selectedTemplate ? renderTemplate(selectedTemplate.body_template, vars) : "" };
  });

  async function handleRecord() {
    if (!selectedTemplate || previews.length === 0) return;
    setRecording(true);
    setRecordError(null);
    const result = await recordImmediateJobs(previews.map(p => ({
      business_card_id: p.card.id,
      template_id: selectedTemplate.id,
      to_email: p.card.email!,
      subject: p.subject,
      body: p.body,
    })));
    if (result?.error) { setRecordError(result.error); setRecording(false); return; }
    router.push("/cards");
  }

  return (
    <div style={s.root}>
      <Stepper step={step} />
      <div style={s.body}>
        {step === 1 && <Step1 cards={cards} selectedIds={selectedCardIds} onToggle={toggleCard} onNext={() => setStep(2)} />}
        {step === 2 && <Step2 templates={templates} selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <Step3 previews={previews} onBack={() => setStep(2)} onRecord={handleRecord} recording={recording} recordError={recordError} />}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { maxWidth: 800 },
  body: { background: "#fff", borderRadius: 8, padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  stepper: { display: "flex", alignItems: "center", marginBottom: "1.5rem" },
  stepItem: { display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 },
  stepActive: { background: "#2563eb", color: "#fff" },
  stepDone: { background: "#16a34a", color: "#fff" },
  stepIdle: { background: "#e2e8f0", color: "#94a3b8" },
  stepLabel: { fontSize: "0.8125rem", color: "#94a3b8", whiteSpace: "nowrap" },
  stepLabelActive: { color: "#1e293b", fontWeight: 600 },
  stepLine: { flex: 1, height: 1, background: "#e2e8f0", margin: "0 0.25rem" },
  stepTitle: { fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem", color: "#1e293b" },
  stepDesc: { fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" },
  stepActions: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" },
  selCount: { fontSize: "0.875rem", color: "#64748b" },
  empty: { color: "#94a3b8", fontSize: "0.875rem", padding: "1rem 0" },
  cardList: { display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" },
  cardRow: { display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 1rem", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer" },
  cardRowChecked: { border: "1px solid #93c5fd", background: "#eff6ff" },
  cardRowDisabled: { opacity: 0.5, cursor: "not-allowed" },
  checkbox: { width: 16, height: 16, flexShrink: 0, cursor: "pointer" },
  cardInfo: { display: "flex", gap: "1rem", flexWrap: "wrap", flex: 1 },
  cardName: { fontWeight: 600, color: "#1e293b", fontSize: "0.9375rem" },
  cardCompany: { color: "#64748b", fontSize: "0.875rem" },
  cardEmail: { color: "#2563eb", fontSize: "0.875rem" },
  noEmailLabel: { fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginTop: "0.5rem", marginBottom: "0.375rem" },
  tmplList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  tmplRow: { display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "0.875rem 1rem", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer" },
  tmplRowChecked: { border: "1px solid #93c5fd", background: "#eff6ff" },
  radio: { marginTop: 3, flexShrink: 0, cursor: "pointer" },
  tmplInfo: { flex: 1 },
  tmplNameRow: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" },
  tmplName: { fontWeight: 600, color: "#1e293b", fontSize: "0.9375rem" },
  badge: { padding: "0.125rem 0.5rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600 },
  tmplSubject: { fontSize: "0.8125rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 },
  previewList: { display: "flex", flexDirection: "column", gap: "1rem" },
  previewCard: { border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" },
  previewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: "0.5rem" },
  previewName: { fontWeight: 600, fontSize: "0.9375rem", color: "#1e293b", display: "block" },
  previewTo: { fontSize: "0.8125rem", color: "#64748b" },
  openBtn: { padding: "0.375rem 0.875rem", background: "#2563eb", color: "#fff", borderRadius: 4, fontSize: "0.875rem", flexShrink: 0, whiteSpace: "nowrap" },
  previewBody: { padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.625rem" },
  previewField: { display: "flex", gap: "0.75rem" },
  fieldKey: { fontSize: "0.8125rem", fontWeight: 600, color: "#94a3b8", width: 36, flexShrink: 0 },
  fieldVal: { fontSize: "0.9375rem", color: "#1e293b", flex: 1 },
  previewText: { fontSize: "0.875rem", color: "#374151", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, lineHeight: 1.7, flex: 1 },
  openAllBox: { marginTop: "1rem", padding: "0.875rem 1rem", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 6 },
  openAllBtn: { padding: "0.5rem 1.25rem", background: "#d97706", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.9375rem", cursor: "pointer", fontWeight: 600 },
  popupWarn: { fontSize: "0.8125rem", color: "#92400e", marginTop: "0.5rem" },
  errorMsg: { color: "#dc2626", fontSize: "0.875rem", marginTop: "0.75rem" },
  btnPrimary: { padding: "0.5rem 1.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer" },
  btnSecondary: { padding: "0.5rem 1.25rem", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.9375rem", cursor: "pointer" },
  btnSuccess: { padding: "0.5rem 1.5rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer" },
  btnDisabled: { background: "#93c5fd", cursor: "not-allowed" },
};
