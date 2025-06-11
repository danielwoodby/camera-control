//CameraContext.tsx
import { createContext } from 'react';
import * as THREE from 'three';

type Camera = THREE.PerspectiveCamera | THREE.OrthographicCamera | null;

export const CameraContext = createContext<{
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  cameraType: 'perspective' | 'orthographic';
  setCameraType: React.Dispatch<React.SetStateAction<'perspective' | 'orthographic'>>;
}>({
  camera: null,
  setCamera: () => {},// eslint-disable-line @typescript-eslint/no-empty-function
  cameraType: 'perspective',
  setCameraType: () => {},// eslint-disable-line @typescript-eslint/no-empty-function
});
