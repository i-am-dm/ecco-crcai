import type { ReactElement } from 'react';

interface HeatmapProps {
  points: { x: number; y: number; value: number; id: string }[];
}

export function Heatmap({ points }: HeatmapProps) {
  const max = points.reduce((m, p) => Math.max(m, p.value), 1);
  const gridSize = 5;
  const cell = (p: typeof points[number]) => {
    const intensity = p.value / max;
    const bg = `rgba(14, 165, 233, ${0.15 + intensity * 0.7})`;
    return (
      <div
        key={`${p.x}-${p.y}`}
        title={`${p.id}: ${p.value}`}
        className="w-6 h-6 rounded-sm"
        style={{ backgroundColor: bg }}
      />
    );
  };
  const cells: ReactElement[] = [];
  for (let y = 1; y <= gridSize; y++) {
    for (let x = 1; x <= gridSize; x++) {
      const p = points.find((pt) => pt.x === x && pt.y === y);
      cells.push(p ? cell(p) : <div key={`${x}-${y}`} className="w-6 h-6 rounded-sm bg-slate-100 dark:bg-slate-800" />);
    }
  }
  return (
    <div className="grid grid-cols-5 gap-1">
      {cells}
    </div>
  );
}
