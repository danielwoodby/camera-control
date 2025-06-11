// CameraProvider.tsx
import { useState } from 'react';
import * as THREE from 'three';

import { CameraContext } from './CameraContext';

export default function CameraProvider({ children }: { children: React.ReactNode }) {
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
    const [cameraType, setCameraType] = useState<'perspective' | 'orthographic'>('perspective');

  return (
    <CameraContext.Provider value={{ camera, setCamera, cameraType, setCameraType }}>
      {children}
    </CameraContext.Provider>
  );
}

