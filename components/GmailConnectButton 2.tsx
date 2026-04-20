"use client";

export default function GmailConnectButton({ label }: { label: string }) {
  return (
    <a href="/api/auth/gmail" style={styles.button}>
      {label}
    </a>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    display: "inline-block",
    padding: "0.5rem 1.25rem",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 4,
    fontSize: "0.9375rem",
    fontWeight: 600,
    textDecoration: "none",
  },
};
