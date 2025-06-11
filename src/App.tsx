import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';

import CameraProvider from './components/CameraProvider';
import CameraSelector from './components/CameraSelector';
import CustomCamera from './components/CustomCamera';
import Scene from './components/Scene';
import ViewCameraController from './components/ViewCameraController';
import ViewSelector from './components/ViewSelector';

export default function App() {
  const [selectedView, setSelectedView] = useState('front');

  return (
    <CameraProvider>
      <CameraSelector />
      <ViewSelector onChange={setSelectedView} />
      <Canvas>
        <CustomCamera />
        <ViewCameraController view={selectedView} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </CameraProvider>
  );
}
