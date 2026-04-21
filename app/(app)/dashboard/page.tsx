export default function DashboardPage() {
  return (
    <div>
      <h1 style={styles.heading}>ダッシュボード</h1>
      <div style={styles.grid}>
        <StatCard label="保存済み名刺" value="—" />
        <StatCard label="本日の送信予定" value="—" />
        <StatCard label="送信待ちジョブ" value="—" />
      </div>
      <p style={styles.placeholder}>※ 実装予定：最近追加した名刺・送信予定一覧</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={styles.cardValue}>{value}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" },
  card: { background: "#fff", borderRadius: 8, padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  cardLabel: { fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" },
  cardValue: { fontSize: "2rem", fontWeight: 700, color: "#1e3a5f" },
  placeholder: { color: "#94a3b8", fontSize: "0.875rem" },
};
