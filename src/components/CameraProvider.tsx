// CameraProvider.tsx
import { useState } from 'react'
import * as THREE from 'three'

import { CameraContext } from './CameraContext'

export default function CameraProvider({ children }: { children: React.ReactNode }) {
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null)

  return (
    <CameraContext.Provider value={[camera, setCamera]}>
      {children}
    </CameraContext.Provider>
  )
}
