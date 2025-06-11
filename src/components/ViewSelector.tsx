//import { useState } from 'react';

export default function ViewSelector({ onChange }: { onChange: (view: string) => void }) {
  return (
    <div style={{ position: 'absolute', top: 50, left: 10, zIndex: 10 }}>
      <select onChange={(e) => onChange(e.target.value)}>
        <option value="front">Front</option>
        <option value="back">Back</option>
        <option value="left">Left</option>
        <option value="right">Right</option>
        <option value="top">Top</option>
        <option value="bottom">Bottom</option>
      </select>
    </div>
  );
}
