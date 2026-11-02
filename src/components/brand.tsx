export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark">
        <img src="/marixa-logo.png" alt="" width="52" height="52" />
      </div>
      <div>
        <strong>
          MARIXA<span className="brand-dot">.</span>
        </strong>
        {!compact && <small>WORKSPACE · REPORT</small>}
      </div>
    </div>
  );
}
