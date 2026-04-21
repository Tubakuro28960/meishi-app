import TemplateForm from "@/components/templates/TemplateForm";
import { createTemplate } from "@/lib/actions/templates";

export default function TemplatesNewPage() {
  return (
    <div>
      <h1 style={s.heading}>テンプレートを作成</h1>
      <div style={s.wrap}>
        <TemplateForm
          action={createTemplate}
          cancelHref="/templates"
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  heading: { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" },
  wrap:    { background: "#fff", borderRadius: 8, padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
};
