//CameraSelector.tsx
import { useContext } from 'react';

import { CameraContext } from './CameraContext';

export default function CameraSelector() {
  const { cameraType, setCameraType } = useContext(CameraContext);

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10,width:500 }}>
      <select
        value={cameraType}
        onChange={(e) => setCameraType(e.target.value as 'perspective' | 'orthographic')}
      >
        <option value="perspective">Perspective</option>
        <option value="orthographic">Orthographic</option>
      </select>
    </div>
  );
}
