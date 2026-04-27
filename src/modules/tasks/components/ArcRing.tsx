type ArcRingProps = {
  /** 0–1 */
  ratio: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function ArcRing({ ratio, size = 56, strokeWidth = 5, className }: ArcRingProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(Math.max(ratio, 0), 1));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted"
      />
      {/* Fill */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="stroke-primary transition-[stroke-dashoffset] duration-500"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  );
}
