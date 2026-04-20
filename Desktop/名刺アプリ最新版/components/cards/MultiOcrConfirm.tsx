"use client";

import { useState } from "react";
import { createCardsAndSchedule } from "@/lib/actions/cards";
import { useRouter } from "next/navigation";
import { renderTemplate } from "@/lib/templates/render";
import type { OcrParsed } from "@/lib/ocr/parse";
import type { Template } from "@/types/database";

type EditableFields = {
  name: string;
  company: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  memo: string;
};

type CardSendConfig = {
  selectedTemplateId: string | null;
  sendTiming: "immediate" | "scheduled";
  scheduledAt: string;
};

type CardData = {
  rawText: string;
  structured: OcrParsed;
};

type Props = {
  imagePreviewUrl: string | null;
  originalImageUrl: string;
  cards: CardData[];
  templates: Template[];
  onBack: () => void;
};

const FIELDS: { key: keyof EditableFields; label: string; type?: string; wide?: boolean }[] = [
  { key: "name",       label: "氏名" },
  { key: "company",    label: "会社名" },
  { key: "department", label: "部署" },
  { key: "position",   label: "役職" },
  { key: "email",      label: "メールアドレス", type: "email", wide: true },
  { key: "phone",      label: "電話番号",        type: "tel" },
  { key: "address",    label: "住所",            wide: true },
  { key: "website",    label: "Webサイト",       type: "url", wide: true },
  { key: "memo",       label: "備考",            wide: true },
];

function initFields(s: OcrParsed): EditableFields {
  return {
    name: s.name, company: s.company, department: s.department,
    position: s.position, email: s.email, phone: s.phone,
    address: s.address, website: s.website, memo: "",
  };
}

function initSendConfig(templates: Template[]): CardSendConfig {
  const defaultTemplate = templates.find((t) => t.is_default) ?? templates[0] ?? null;
  return {
    selectedTemplateId: defaultTemplate?.id ?? null,
    sendTiming: "immediate",
    scheduledAt: "",
  };
}

type GmailLink = { label: string; url: string };

export default function MultiOcrConfirm({ imagePreviewUrl, originalImageUrl, cards, templates, onBack }: Props) {
  const router = useRouter();
  const [allValues, setAllValues] = useState<EditableFields[]>(
    cards.map(c => initFields(c.structured))
  );
  const [allSendConfigs, setAllSendConfigs] = useState<CardSendConfig[]>(
    cards.map(() => initSendConfig(templates))
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number[]>(cards.map((_, i) => i));
  const [gmailLinks, setGmailLinks] = useState<GmailLink[] | null>(null);

  function setField(cardIdx: number, key: keyof EditableFields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setAllValues(prev => prev.map((v, i) =>
        i === cardIdx ? { ...v, [key]: e.target.value } : v
      ));
    };
  }

  function setSendConfig(cardIdx: number, patch: Partial<CardSendConfig>) {
    setAllSendConfigs(prev => prev.map((c, i) =>
      i === cardIdx ? { ...c, ...patch } : c
    ));
  }

  function toggleExpand(i: number) {
    setExpanded(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }

  async function handleSubmit() {
    setError(null);

    for (let i = 0; i < allValues.length; i++) {
      const cfg = allSendConfigs[i];
      if (cfg.selectedTemplateId && cfg.sendTiming === "scheduled" && !cfg.scheduledAt) {
        setError(`名刺 ${i + 1}: 予約送信の日時を入力してください`);
        setExpanded(prev => prev.includes(i) ? prev : [...prev, i]);
        return;
      }
    }

    setLoading(true);

    const links: GmailLink[] = [];

    const payload = allValues.map((v, i) => {
      const cfg = allSendConfigs[i];
      const template = templates.find(t => t.id === cfg.selectedTemplateId) ?? null;

      let scheduledSendData: Parameters<typeof createCardsAndSchedule>[0][number]["scheduledSendData"] = undefined;

      if (template && v.email) {
        const vars = {
          name: v.name, company: v.company, department: v.department,
          position: v.position, email: v.email, sender_name: null,
        };
        const subject = renderTemplate(template.subject_template, vars);
        const body    = renderTemplate(template.body_template, vars);

        if (cfg.sendTiming === "scheduled") {
          scheduledSendData = {
            template_id: template.id,
            subject,
            body,
            scheduled_at: cfg.scheduledAt,
          };
        } else {
          // 即時送信はGmailリンクをクライアントで開く
          const gmailUrl =
            "https://mail.google.com/mail/?view=cm&fs=1" +
            "&to=" + encodeURIComponent(v.email) +
            "&su=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(body);
          const label = [v.name, v.company].filter(Boolean).join(" / ") || `名刺 ${i + 1}`;
          links.push({ label, url: gmailUrl });
        }
      }

      return {
        cardData: {
          ...v,
          raw_ocr_text: cards[i].rawText,
          original_image_url: originalImageUrl,
        },
        scheduledSendData,
      };
    });

    const result = await createCardsAndSchedule(payload);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (links.length > 0) {
      setGmailLinks(links);
      setLoading(false);
    } else {
      router.push("/cards");
    }
  }

  const sendCount = allSendConfigs.filter((cfg, i) => cfg.selectedTemplateId && allValues[i].email).length;

  if (gmailLinks) {
    return (
      <div style={s.gmailScreen}>
        <p style={s.gmailTitle}>✅ {allValues.length} 枚を保存しました</p>
        <p style={s.gmailSubtitle}>以下のボタンからGmailで送信してください</p>
        <div style={s.gmailList}>
          {gmailLinks.map((link, i) => (
            <div key={i} style={s.gmailRow}>
              <span style={s.gmailLabel}>{link.label}</span>
              <a href={link.url} target="_blank" rel="noopener noreferrer" style={s.gmailBtn}>
                Gmailで送信 →
              </a>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => router.push("/cards")} style={s.doneBtn}>
          完了（名刺一覧へ）
        </button>
      </div>
    );
  }

  return (
    <div>
      {imagePreviewUrl && (
        <div style={s.imageRow}>
          <img src={imagePreviewUrl} alt="元の画像" style={s.previewImg} />
          <p style={s.imageCaption}>読み取り元の画像</p>
        </div>
      )}

      <div style={s.cardList}>
        {allValues.map((values, cardIdx) => {
          const cfg = allSendConfigs[cardIdx];
          const isOpen = expanded.includes(cardIdx);
          const emailEmpty = !values.email.trim();
          const summary = [values.name, values.company].filter(Boolean).join(" / ") || "（未入力）";
          const selectedTemplate = templates.find(t => t.id === cfg.selectedTemplateId) ?? null;

          return (
            <div key={cardIdx} style={s.card}>
              <button
                type="button"
                onClick={() => toggleExpand(cardIdx)}
                style={s.cardHeader}
              >
                <span style={s.cardTitle}>名刺 {cardIdx + 1}</span>
                <span style={s.cardSummary}>{summary}</span>
                {cfg.selectedTemplateId && (
                  <span style={s.sendBadge}>
                    {cfg.sendTiming === "scheduled" ? "📅 予約" : "📨 即時"}
                  </span>
                )}
                <span style={s.chevron}>{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div style={s.cardBody}>
                  {emailEmpty && (
                    <div style={s.warning} role="alert">
                      ⚠ メールアドレスが読み取れませんでした。送信する場合は手動で入力してください。
                    </div>
                  )}

                  <div style={s.grid}>
                    {FIELDS.map(({ key, label, type, wide }) => (
                      <div key={key} style={wide ? s.fullCol : s.halfCol}>
                        <label style={s.label}>{label}</label>
                        {key === "memo" ? (
                          <textarea
                            value={values[key]}
                            onChange={setField(cardIdx, key)}
                            rows={2}
                            style={s.textarea}
                          />
                        ) : (
                          <input
                            type={type ?? "text"}
                            value={values[key]}
                            onChange={setField(cardIdx, key)}
                            style={{
                              ...s.input,
                              ...(key === "email" && emailEmpty ? s.inputWarn : {}),
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 送信設定（カードごと） */}
                  <div style={s.sendSection}>
                    <p style={s.sendTitle}>メール送信設定</p>
                    <div style={s.tmplList}>
                      {templates.map((t) => (
                        <label
                          key={t.id}
                          style={{
                            ...s.tmplRow,
                            ...(cfg.selectedTemplateId === t.id ? s.tmplRowSelected : {}),
                          }}
                        >
                          <input
                            type="radio"
                            name={`template-${cardIdx}`}
                            checked={cfg.selectedTemplateId === t.id}
                            onChange={() => setSendConfig(cardIdx, { selectedTemplateId: t.id })}
                            style={s.radio}
                          />
                          <div style={s.tmplInfo}>
                            <span style={s.tmplName}>{t.name}</span>
                            {t.is_default && <span style={s.badge}>デフォルト</span>}
                            <span style={s.tmplSubject}>件名: {t.subject_template || "（未設定）"}</span>
                          </div>
                        </label>
                      ))}
                      <label
                        style={{
                          ...s.tmplRow,
                          ...(cfg.selectedTemplateId === null ? s.tmplRowSelected : {}),
                        }}
                      >
                        <input
                          type="radio"
                          name={`template-${cardIdx}`}
                          checked={cfg.selectedTemplateId === null}
                          onChange={() => setSendConfig(cardIdx, { selectedTemplateId: null })}
                          style={s.radio}
                        />
                        <span style={s.tmplNone}>送信しない（保存のみ）</span>
                      </label>
                    </div>

                    {selectedTemplate && (
                      <div style={s.timingSection}>
                        <span style={s.timingLabel}>送信タイミング:</span>
                        {(["immediate", "scheduled"] as const).map((val) => (
                          <label key={val} style={s.timingOption}>
                            <input
                              type="radio"
                              name={`timing-${cardIdx}`}
                              checked={cfg.sendTiming === val}
                              onChange={() => setSendConfig(cardIdx, { sendTiming: val })}
                            />
                            {val === "immediate" ? "即時送信" : "予約送信"}
                          </label>
                        ))}
                        {cfg.sendTiming === "scheduled" && (
                          <input
                            type="datetime-local"
                            value={cfg.scheduledAt}
                            onChange={(e) => setSendConfig(cardIdx, { scheduledAt: e.target.value })}
                            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                            style={s.datetimeInput}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p style={s.error}>{error}</p>}

      <div style={s.actions}>
        <button type="button" onClick={onBack} style={s.backBtn}>
          ← 撮り直す
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...s.saveBtn, ...(loading ? s.saveBtnDisabled : {}) }}
        >
          {loading
            ? "処理中..."
            : sendCount > 0
            ? `全 ${allValues.length} 枚を保存（${sendCount} 件送信）`
            : `全 ${allValues.length} 枚を保存`}
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  imageRow: {
    marginBottom: "1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  },
  previewImg: {
    maxHeight: 220,
    maxWidth: "100%",
    objectFit: "contain",
    borderRadius: 4,
    border: "1px solid #e2e8f0",
  },
  imageCaption: {
    fontSize: "0.8125rem",
    color: "#94a3b8",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1.5rem",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  cardHeader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1rem",
    background: "#f8fafc",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: "0.9375rem",
    color: "#1e40af",
    flexShrink: 0,
  },
  cardSummary: {
    flex: 1,
    fontSize: "0.875rem",
    color: "#64748b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  sendBadge: {
    fontSize: "0.75rem",
    background: "#ede9fe",
    color: "#6d28d9",
    borderRadius: 4,
    padding: "0.1rem 0.5rem",
    fontWeight: 600,
    flexShrink: 0,
  },
  chevron: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    flexShrink: 0,
  },
  cardBody: {
    padding: "1rem 1.25rem 1.25rem",
  },
  warning: {
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
    borderRadius: 4,
    padding: "0.5rem 0.75rem",
    fontSize: "0.8125rem",
    marginBottom: "0.875rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem 1rem",
  },
  halfCol: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  fullCol: { display: "flex", flexDirection: "column", gap: "0.2rem", gridColumn: "1 / -1" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#374151" },
  input: {
    padding: "0.4rem 0.6rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.9rem",
  },
  inputWarn: {
    borderColor: "#fcd34d",
    background: "#fffbeb",
  },
  textarea: {
    padding: "0.4rem 0.6rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.9rem",
    resize: "vertical",
  },
  sendSection: {
    marginTop: "1.25rem",
    paddingTop: "1rem",
    borderTop: "1px solid #f1f5f9",
  },
  sendTitle: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#374151",
    marginBottom: "0.625rem",
  },
  tmplList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    marginBottom: "0.625rem",
  },
  tmplRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.625rem",
    padding: "0.5rem 0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    cursor: "pointer",
    background: "#f8fafc",
  },
  tmplRowSelected: {
    border: "1px solid #93c5fd",
    background: "#eff6ff",
  },
  radio: { marginTop: 3, flexShrink: 0, cursor: "pointer" },
  tmplInfo: { display: "flex", flexDirection: "column", gap: "0.1rem", flex: 1 },
  tmplName: { fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" },
  badge: {
    display: "inline-block",
    padding: "0.1rem 0.4rem",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 20,
    fontSize: "0.7rem",
    fontWeight: 600,
    marginLeft: "0.375rem",
  },
  tmplSubject: { fontSize: "0.775rem", color: "#64748b" },
  tmplNone: { fontSize: "0.875rem", color: "#64748b" },
  timingSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.5rem 0.75rem",
    background: "#f8fafc",
    borderRadius: 4,
    flexWrap: "wrap",
  },
  timingLabel: { fontSize: "0.8125rem", fontWeight: 600, color: "#374151", flexShrink: 0 },
  timingOption: { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", cursor: "pointer" },
  datetimeInput: {
    padding: "0.3rem 0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.8125rem",
    color: "#1e293b",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.875rem",
    marginBottom: "0.75rem",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.5rem",
  },
  backBtn: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.875rem",
    color: "#374151",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "0.625rem 1.75rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  saveBtnDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },
  gmailScreen: {
    padding: "2rem 1.5rem",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    maxWidth: 560,
    margin: "0 auto",
  },
  gmailTitle: {
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "0.375rem",
  },
  gmailSubtitle: {
    fontSize: "0.9rem",
    color: "#64748b",
    marginBottom: "1.5rem",
  },
  gmailList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
    marginBottom: "1.75rem",
  },
  gmailRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    background: "#f8fafc",
  },
  gmailLabel: {
    fontSize: "0.9375rem",
    color: "#1e293b",
    fontWeight: 500,
  },
  gmailBtn: {
    padding: "0.4rem 1rem",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 4,
    fontSize: "0.875rem",
    fontWeight: 600,
    textDecoration: "none",
    flexShrink: 0,
  },
  doneBtn: {
    padding: "0.5rem 1.5rem",
    background: "#475569",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
