// App.tsx

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

import CameraProvider from './components/CameraProvider' // ✅
import Scene from './components/Scene'

export default function App() {
  return (
    <CameraProvider>
      <Canvas camera={{ position: [50, 10, -50], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </CameraProvider>
  )
}
