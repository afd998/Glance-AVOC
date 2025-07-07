import React from 'react';

// Configurable grid size
const COLS = 12;
const ROWS = 8;
const CELL_WIDTH = 60;
const CELL_HEIGHT = 48;
const WAVE_AMPLITUDE = 32;
const WAVE_FREQUENCY = 2 * Math.PI / COLS;

// Helper: get y offset for a given x (column)
function getWaveYOffset(col, totalCols, amplitude = WAVE_AMPLITUDE, freq = WAVE_FREQUENCY) {
  return Math.sin(col * freq) * amplitude;
}

export default function WavyGrid({
  cols = COLS,
  rows = ROWS,
  cellWidth = CELL_WIDTH,
  cellHeight = CELL_HEIGHT,
  amplitude = WAVE_AMPLITUDE,
  frequency = WAVE_FREQUENCY,
}) {
  const width = cols * cellWidth;
  const height = rows * cellHeight + amplitude * 2;

  // Precompute all points for the grid
  // Each cell corner is warped vertically by the sine wave
  const points = [];
  for (let row = 0; row <= rows; row++) {
    const rowPoints = [];
    for (let col = 0; col <= cols; col++) {
      // The wave is applied to each column, offset by row for a ribbon effect
      const yOffset = getWaveYOffset(col, cols, amplitude, frequency) + amplitude;
      const y = row * cellHeight + yOffset;
      const x = col * cellWidth;
      rowPoints.push({ x, y });
    }
    points.push(rowPoints);
  }

  // Draw grid lines
  const gridLines = [];
  // Horizontal lines
  for (let row = 0; row <= rows; row++) {
    const path = points[row].map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ');
    gridLines.push(<path key={`h${row}`} d={path} stroke="#111" strokeWidth={2} fill="none" />);
  }
  // Vertical lines
  for (let col = 0; col <= cols; col++) {
    let path = '';
    for (let row = 0; row <= rows; row++) {
      const pt = points[row][col];
      path += `${row === 0 ? 'M' : 'L'}${pt.x},${pt.y} `;
    }
    gridLines.push(<path key={`v${col}`} d={path} stroke="#111" strokeWidth={2} fill="none" />);
  }

  // Draw cells (blue rectangles, warped)
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Each cell is a warped quadrilateral
      const p1 = points[row][col];
      const p2 = points[row][col + 1];
      const p3 = points[row + 1][col + 1];
      const p4 = points[row + 1][col];
      // Optionally, alternate blue shades for effect
      const fill = `hsl(210, 80%, ${45 + ((row + col) % 2) * 10}%)`;
      cells.push(
        <polygon
          key={`cell-${row}-${col}`}
          points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
          fill={fill}
          stroke="none"
        />
      );
    }
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', margin: '0 auto', background: '#faf6f2', borderRadius: 16 }}>
      {cells}
      {gridLines}
    </svg>
  );
} 