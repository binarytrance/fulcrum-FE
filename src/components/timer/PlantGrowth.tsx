"use client"

type Props = {
  growthPercent: number
  size?: number
}

export default function PlantGrowth({ growthPercent, size = 220 }: Props) {
  const g = Math.max(0, Math.min(100, growthPercent))

  // ── Layout constants (all relative to `size`) ────────────────────────────
  const cx       = size * 0.5          // horizontal center
  const potRimY  = size * 0.70         // top of pot rim
  const potBodyY = size * 0.735        // top of pot body (below rim)
  const potBotY  = size * 0.93         // bottom of pot
  const soilY    = size * 0.715        // soil surface (just inside rim)

  // Stem: grows from soilY upward
  const maxStemH = soilY - size * 0.07 // max stem height (leaves top padding)
  const stemH    = (g / 100) * maxStemH
  const stemTopY = soilY - stemH
  const stemW    = Math.max(2.5, size * 0.022)

  // Leaf anchor points along the stem (linear interpolation)
  const leaf1Y = soilY - stemH * 0.28
  const leaf2Y = soilY - stemH * 0.54
  const leaf3Y = soilY - stemH * 0.78

  // Visibility thresholds
  const showLeaf1  = g > 18
  const showLeaf2  = g > 45
  const showLeaf3  = g > 70
  const showFlower = g > 83
  const fullBloom  = g > 92

  // Cubic bezier control points for a natural curving stem
  const cp1x = cx + size * 0.065
  const cp1y = soilY - stemH * 0.30
  const cp2x = cx - size * 0.045
  const cp2y = soilY - stemH * 0.68
  const stemPath = stemH > 1
    ? `M ${cx} ${soilY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${cx} ${stemTopY}`
    : `M ${cx} ${soilY} L ${cx} ${soilY}`

  // ── Leaf helpers ─────────────────────────────────────────────────────────
  function Leaf({
    anchorX,
    anchorY,
    side,
    rx,
    ry,
    angle,
    color,
    veinColor,
    visible,
  }: {
    anchorX: number
    anchorY: number
    side: number
    rx: number
    ry: number
    angle: number
    color: string
    veinColor: string
    visible: boolean
  }) {
    const rad    = (angle * Math.PI) / 180
    const tipX   = anchorX + side * Math.cos(rad) * rx * 1.9
    const tipY   = anchorY - Math.sin(Math.abs(rad)) * rx * 0.5
    return (
      <g
        style={{
          opacity:    visible ? 1 : 0,
          transition: "opacity 1s ease-in-out",
        }}
      >
        <ellipse
          cx={anchorX}
          cy={anchorY}
          rx={rx}
          ry={ry}
          fill={color}
          transform={`rotate(${side === -1 ? -angle : angle} ${anchorX} ${anchorY})`}
          style={{ transition: "all 1.2s ease-in-out" }}
        />
        {/* midrib */}
        <line
          x1={anchorX}
          y1={anchorY}
          x2={tipX}
          y2={tipY}
          stroke={veinColor}
          strokeWidth={0.9}
          strokeLinecap="round"
          opacity={0.55}
        />
      </g>
    )
  }

  // ── Flower petal helper ───────────────────────────────────────────────────
  function Petals() {
    const petalCount = 6
    const petalOrbitR = size * 0.058
    const petalRx     = size * 0.052
    const petalRy     = size * 0.026
    const petals = []
    for (let i = 0; i < petalCount; i++) {
      const angleDeg = (i / petalCount) * 360 - 90
      const angleRad = (angleDeg * Math.PI) / 180
      const pcx = cx + Math.cos(angleRad) * petalOrbitR
      const pcy = stemTopY + Math.sin(angleRad) * petalOrbitR
      petals.push(
        <ellipse
          key={i}
          cx={pcx}
          cy={pcy}
          rx={petalRx}
          ry={petalRy}
          fill={fullBloom ? "#f9a8d4" : "#bbf7d0"}
          transform={`rotate(${angleDeg + 90} ${pcx} ${pcy})`}
          style={{ transition: "fill 1.8s ease-in-out" }}
        />
      )
    }
    return <>{petals}</>
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Plant growth: ${Math.round(g)}%`}
      role="img"
    >
      {/* ── Drop shadow filter ──────────────────────────────────────────── */}
      <defs>
        <filter id="plant-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000033" />
        </filter>
        <radialGradient id="pot-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#e07b45" />
          <stop offset="100%" stopColor="#9a3e1a" />
        </radialGradient>
        <linearGradient id="rim-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#e8865a" />
          <stop offset="100%" stopColor="#b84e22" />
        </linearGradient>
        <radialGradient id="soil-grad" cx="50%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#4a3520" />
          <stop offset="100%" stopColor="#1e0f05" />
        </radialGradient>
      </defs>

      {/* ── Pot body (trapezoid) ─────────────────────────────────────────── */}
      <path
        d={`
          M ${size * 0.27} ${potBodyY}
          L ${size * 0.73} ${potBodyY}
          L ${size * 0.675} ${potBotY}
          L ${size * 0.325} ${potBotY}
          Z
        `}
        fill="url(#pot-grad)"
        stroke="#7a3018"
        strokeWidth="1.2"
        filter="url(#plant-shadow)"
      />

      {/* Pot highlight stripe */}
      <path
        d={`
          M ${size * 0.335} ${potBodyY + size * 0.02}
          L ${size * 0.37}  ${potBotY  - size * 0.03}
        `}
        stroke="#e8976a"
        strokeWidth={size * 0.016}
        strokeLinecap="round"
        opacity={0.35}
      />

      {/* ── Pot rim ──────────────────────────────────────────────────────── */}
      <rect
        x={size * 0.245}
        y={potRimY}
        width={size * 0.51}
        height={size * 0.052}
        rx={size * 0.018}
        fill="url(#rim-grad)"
        stroke="#7a3018"
        strokeWidth="1"
      />

      {/* ── Soil ─────────────────────────────────────────────────────────── */}
      <ellipse
        cx={cx}
        cy={soilY}
        rx={size * 0.205}
        ry={size * 0.024}
        fill="url(#soil-grad)"
      />
      {/* Soil texture dots */}
      {[0.42, 0.52, 0.62, 0.38, 0.58].map((xf, i) => (
        <circle
          key={i}
          cx={size * xf}
          cy={soilY - size * 0.004}
          r={size * 0.006}
          fill="#2a1505"
          opacity={0.5}
        />
      ))}

      {/* ── Stem ─────────────────────────────────────────────────────────── */}
      {stemH > 1 && (
        <path
          d={stemPath}
          stroke="#22c55e"
          strokeWidth={stemW}
          fill="none"
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0 0 3px #16a34a55)",
            transition: "all 1.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      )}

      {/* ── Leaf 1 — lower left ──────────────────────────────────────────── */}
      <Leaf
        anchorX={cx - size * 0.01}
        anchorY={leaf1Y}
        side={-1}
        rx={size * 0.115}
        ry={size * 0.046}
        angle={28}
        color="#16a34a"
        veinColor="#15803d"
        visible={showLeaf1}
      />

      {/* ── Leaf 2 — mid right ───────────────────────────────────────────── */}
      <Leaf
        anchorX={cx + size * 0.01}
        anchorY={leaf2Y}
        side={1}
        rx={size * 0.11}
        ry={size * 0.044}
        angle={32}
        color="#4ade80"
        veinColor="#22c55e"
        visible={showLeaf2}
      />

      {/* ── Leaf 3 — upper left ──────────────────────────────────────────── */}
      <Leaf
        anchorX={cx - size * 0.008}
        anchorY={leaf3Y}
        side={-1}
        rx={size * 0.09}
        ry={size * 0.037}
        angle={24}
        color="#86efac"
        veinColor="#4ade80"
        visible={showLeaf3}
      />

      {/* ── Flower ───────────────────────────────────────────────────────── */}
      <g
        style={{
          opacity:    showFlower ? 1 : 0,
          transition: "opacity 1.2s ease-in-out",
        }}
      >
        {/* Petals */}
        <Petals />

        {/* Stamen ring */}
        {fullBloom && (
          <circle
            cx={cx}
            cy={stemTopY}
            r={size * 0.022}
            fill="none"
            stroke="#fde68a"
            strokeWidth={size * 0.012}
            strokeDasharray={`${size * 0.008} ${size * 0.014}`}
            style={{ transition: "all 1.5s ease-in-out" }}
          />
        )}

        {/* Flower center */}
        <circle
          cx={cx}
          cy={stemTopY}
          r={size * 0.038}
          fill={fullBloom ? "#fbbf24" : "#86efac"}
          stroke={fullBloom ? "#f59e0b" : "#4ade80"}
          strokeWidth="1"
          style={{ transition: "fill 1.8s ease-in-out, stroke 1.8s ease-in-out" }}
        />

        {/* Center dot */}
        <circle
          cx={cx}
          cy={stemTopY}
          r={size * 0.014}
          fill={fullBloom ? "#d97706" : "#16a34a"}
          style={{ transition: "fill 1.8s ease-in-out" }}
        />
      </g>

      {/* ── Growth % label ───────────────────────────────────────────────── */}
      <text
        x={cx}
        y={size * 0.99}
        textAnchor="middle"
        fontSize={size * 0.068}
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        fill={g > 85 ? "#f9a8d4" : "#4ade80"}
        style={{ transition: "fill 1.5s ease-in-out" }}
        opacity={0.85}
      >
        {Math.round(g)}%
      </text>
    </svg>
  )
}
