export const CENTER = 400; // SVG 800x800
export const SIZE = 800;

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function rotatePoint(px: number, py: number, cx: number, cy: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  const s = Math.sin(a);
  const c = Math.cos(a);
  const dx = px - cx;
  const dy = py - cy;
  const x = dx * c - dy * s + cx;
  const y = dx * s + dy * c + cy;
  return { x, y };
}

export function polygonPath(cx: number, cy: number, radius: number, sides: number, rotation = 0) {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + (rotation * Math.PI) / 180;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

export function starPath(cx: number, cy: number, radius: number, sides: number, innerRatio = 0.5, rotation = 0) {
  const pts: string[] = [];
  const total = sides * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? radius : radius * innerRatio;
    const a = (i / total) * Math.PI * 2 + (rotation * Math.PI) / 180;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

export function petalPath(cx: number, cy: number, size: number, rotation = 0) {
  const w = size;
  const h = size * 1.6;
  const rx = w / 2;
  const ry = h / 2;
  const p1 = rotatePoint(cx, cy - ry, cx, cy, rotation);
  const p2 = rotatePoint(cx + rx, cy, cx, cy, rotation);
  const p3 = rotatePoint(cx, cy + ry, cx, cy, rotation);
  const p4 = rotatePoint(cx - rx, cy, cx, cy, rotation);
  return `M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y} Q ${p4.x} ${p4.y} ${p1.x} ${p1.y} Z`;
}

export function ringPath(cx: number, cy: number, rOuter: number, rInner: number, rotation = 0, segments = 64) {
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2 + (rotation * Math.PI) / 180;
    const xo = cx + Math.cos(a) * rOuter;
    const yo = cy + Math.sin(a) * rOuter;
    outer.push(`${xo},${yo}`);
  }
  for (let i = segments - 1; i >= 0; i--) {
    const a = (i / segments) * Math.PI * 2 + (rotation * Math.PI) / 180;
    const xi = cx + Math.cos(a) * rInner;
    const yi = cy + Math.sin(a) * rInner;
    inner.push(`${xi},${yi}`);
  }
  return [...outer, ...inner].join(" ");
}

// --- New Texture/Shape Paths ---

export function marigoldPath(cx: number, cy: number, size: number, rotation = 0) {
  // Complex scalloped circle
  // Easier: simple high-res loop
  const segments = 64;
  const pathData: string[] = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    // r = r0 + amp * sin(freq * theta)
    const r = size * (0.9 + 0.1 * Math.cos(12 * theta));

    const a = theta + (rotation * Math.PI) / 180;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);

    if (i === 0) pathData.push(`M ${x} ${y}`);
    else pathData.push(`L ${x} ${y}`);
  }
  pathData.push("Z");
  return pathData.join(" ");
}

export function lotusPath(cx: number, cy: number, size: number, rotation = 0) {
  // A classic lotus bud / petal shape
  // Pointy top, wide bottom
  const w = size * 0.8;
  const h = size * 1.5;

  // Points relative to center (unrotated)
  // Top
  const p1 = { x: 0, y: -h / 2 };
  // Right bulge
  const p2 = { x: w / 2, y: 0 };
  // Bottom
  const p3 = { x: 0, y: h / 2 };
  // Left bulge
  const p4 = { x: -w / 2, y: 0 };

  // Rotate them
  const r1 = rotatePoint(cx + p1.x, cy + p1.y, cx, cy, rotation);
  const r2 = rotatePoint(cx + p2.x, cy + p2.y, cx, cy, rotation);
  const r3 = rotatePoint(cx + p3.x, cy + p3.y, cx, cy, rotation);
  const r4 = rotatePoint(cx + p4.x, cy + p4.y, cx, cy, rotation);

  // Curve bottom more than top
  return `M ${r1.x} ${r1.y} C ${r2.x} ${r2.y} ${r2.x} ${r2.y} ${r3.x} ${r3.y} C ${r4.x} ${r4.y} ${r4.x} ${r4.y} ${r1.x} ${r1.y} Z`;
}

export function leafPath(cx: number, cy: number, size: number, rotation = 0) {
  // Mango leaf shape
  const len = size * 1.2;
  const wid = size * 0.5;

  const pStart = rotatePoint(cx, cy + len / 2, cx, cy, rotation);
  const pEnd = rotatePoint(cx, cy - len / 2, cx, cy, rotation);

  // Control points for asymmetric curve
  const cp1 = rotatePoint(cx + wid, cy + len / 4, cx, cy, rotation); // right bulge

  const cp3 = rotatePoint(cx - wid, cy - len / 4, cx, cy, rotation); // left bulge (diff)


  return `M ${pStart.x} ${pStart.y} Q ${cp1.x} ${cp1.y} ${pEnd.x} ${pEnd.y} Q ${cp3.x} ${cp3.y} ${pStart.x} ${pStart.y} Z`;
}
