export default function StatusPill({ label, color }) {
  return (
    <span className="pill" style={{ background: `color-mix(in srgb, ${color} 14%, white)`, color }}>
      <span className="pill-dot" style={{ background: color }} />
      {label}
    </span>
  );
}
