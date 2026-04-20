"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import OcrConfirmForm from "@/components/cards/OcrConfirmForm";
import MultiOcrConfirm from "@/components/cards/MultiOcrConfirm";
import type { OcrParsed } from "@/lib/ocr/parse";
import type { Template } from "@/types/database";

type OcrCardResult = {
  rawText: string;
  structured: OcrParsed;
};

type OcrResponse = {
  imageUrl: string;
  cards: OcrCardResult[];
};

const ACCEPT = "image/jpeg,image/png";
const MAX_BYTES = 3.5 * 1024 * 1024;

async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_BYTES) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      const steps = [
        { scale: 0.85, quality: 0.82 },
        { scale: 0.75, quality: 0.78 },
        { scale: 0.65, quality: 0.72 },
        { scale: 0.55, quality: 0.65 },
        { scale: 0.45, quality: 0.60 },
        { scale: 0.35, quality: 0.55 },
      ];

      let i = 0;
      const tryNext = () => {
        if (i >= steps.length) { resolve(file); return; }
        const { scale, quality } = steps[i++];
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size <= MAX_BYTES) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              tryNext();
            }
          },
          "image/jpeg",
          quality
        );
      };

      tryNext();
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

type Props = {
  templates: Template[];
};

export default function CardsNewClient({ templates }: Props) {
  const [step, setStep] = useState<"upload" | "confirm">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function applyFile(selected: File) {
    if (!selected.type.match(/image\/(jpeg|png|jpg)/)) {
      setError("JPG または PNG の画像を選択してください");
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError(null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  }

  async function handleOcr() {
    if (!file) return;
    setLoading(true);
    setError(null);

    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("image", compressed);

    try {
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "OCR処理に失敗しました");
        return;
      }
      setOcrResult(json as OcrResponse);
      setStep("confirm");
    } catch {
      setError("サーバーとの通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep("upload");
    setOcrResult(null);
  }

  if (step === "confirm" && ocrResult) {
    const { imageUrl, cards } = ocrResult;

    if (cards.length > 1) {
      return (
        <div>
          <div style={s.header}>
            <h1 style={s.heading}>OCR結果を確認・編集</h1>
            <p style={s.subtext}>
              <span style={s.badge}>{cards.length}枚の名刺を検出</span>
              各名刺の内容を確認・修正してから保存してください。
            </p>
          </div>
          <MultiOcrConfirm
            imagePreviewUrl={previewUrl}
            originalImageUrl={imageUrl}
            cards={cards}
            templates={templates}
            onBack={handleBack}
          />
        </div>
      );
    }

    const single = cards[0] ?? { rawText: "", structured: {} as OcrParsed };
    return (
      <div>
        <div style={s.header}>
          <h1 style={s.heading}>OCR結果を確認・編集</h1>
          <p style={s.subtext}>読み取り結果を確認してください。誤りは手動で修正できます。</p>
        </div>
        <OcrConfirmForm
          imagePreviewUrl={previewUrl}
          rawText={single.rawText}
          originalImageUrl={imageUrl}
          initial={single.structured}
          templates={templates}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.heading}>名刺を追加</h1>
        <p style={s.subtext}>
          名刺の画像をアップロードして OCR で情報を抽出します。<br />
          <span style={s.tip}>複数枚が写った画像もまとめて読み取れます。</span>
        </p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        style={{
          ...s.dropZone,
          ...(isDragging ? s.dropZoneActive : {}),
          ...(previewUrl ? s.dropZoneWithImage : {}),
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="プレビュー" style={s.preview} />
        ) : (
          <div style={s.dropHint}>
            <span style={s.dropIcon}>📷</span>
            <p style={s.dropText}>ここをクリック、またはドラッグ＆ドロップ</p>
            <p style={s.dropSub}>JPG / PNG・複数枚OK（大きい画像は自動圧縮）</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      {previewUrl && (
        <p style={s.fileName}>
          {file?.name}{" "}
          <button
            type="button"
            onClick={() => { setFile(null); setPreviewUrl(null); setError(null); }}
            style={s.clearBtn}
          >
            ✕ 選択解除
          </button>
        </p>
      )}

      {error && (
        <div style={s.errorBox} role="alert">
          {error}
        </div>
      )}

      <div style={s.actions}>
        <Link href="/cards" style={s.cancelBtn}>キャンセル</Link>
        <button
          onClick={handleOcr}
          disabled={!file || loading}
          style={{ ...s.ocrBtn, ...(!file || loading ? s.ocrBtnDisabled : {}) }}
        >
          {loading ? <span>解析中...</span> : "OCR実行 →"}
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { marginBottom: "1.5rem" },
  heading: { fontSize: "1.5rem", fontWeight: 700 },
  subtext: { color: "#64748b", fontSize: "0.9rem", marginTop: "0.25rem" },
  badge: {
    display: "inline-block",
    background: "#dbeafe",
    color: "#1e40af",
    borderRadius: 4,
    padding: "0.1rem 0.5rem",
    fontSize: "0.8125rem",
    fontWeight: 700,
    marginRight: "0.5rem",
  },
  tip: { color: "#2563eb", fontSize: "0.8125rem" },
  dropZone: {
    border: "2px dashed #cbd5e1",
    borderRadius: 8,
    padding: "2.5rem",
    textAlign: "center",
    background: "#f8fafc",
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    marginBottom: "0.75rem",
    minHeight: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropZoneActive: {
    borderColor: "#2563eb",
    background: "#eff6ff",
  },
  dropZoneWithImage: {
    padding: "1rem",
    background: "#fff",
    borderColor: "#94a3b8",
  },
  dropHint: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" },
  dropIcon: { fontSize: "2.5rem" },
  dropText: { color: "#475569", fontWeight: 500 },
  dropSub: { fontSize: "0.8125rem", color: "#94a3b8" },
  preview: {
    maxHeight: 260,
    maxWidth: "100%",
    objectFit: "contain",
    borderRadius: 4,
  },
  fileName: { fontSize: "0.875rem", color: "#64748b", marginBottom: "0.75rem" },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "0.8125rem",
    marginLeft: "0.5rem",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: 4,
    padding: "0.625rem 0.875rem",
    fontSize: "0.875rem",
    marginBottom: "1rem",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "1rem",
  },
  cancelBtn: {
    padding: "0.5rem 1.25rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    color: "#374151",
    fontSize: "0.9375rem",
    background: "#fff",
  },
  ocrBtn: {
    padding: "0.5rem 1.5rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  ocrBtnDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },
};
