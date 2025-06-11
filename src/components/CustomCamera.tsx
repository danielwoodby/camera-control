// components/CustomCamera.tsx
import { useThree } from '@react-three/fiber';
import { useContext,useEffect, useRef } from 'react';
import * as THREE from 'three';

import { CameraContext } from './CameraContext';

export default function CustomCamera() {
  const { setCamera, cameraType } = useContext(CameraContext);
  const { set, size } = useThree();
  const perspectiveRef = useRef<THREE.PerspectiveCamera>(null);
  const orthoRef = useRef<THREE.OrthographicCamera>(null);

  useEffect(() => {
    const aspect = size.width / size.height;
    const d = 250;

    // Create cameras if not created already
    if (!perspectiveRef.current) {
      perspectiveRef.current = new THREE.PerspectiveCamera(50, aspect, 0.01, 1000);
      perspectiveRef.current.position.set(50, 10, -50);
    }

    if (!orthoRef.current) {
      orthoRef.current = new THREE.OrthographicCamera(
        -d * aspect,
        d * aspect,
        d,
        -d,
        0.1,
        1000
      );
      orthoRef.current.position.set(50, 10, -50);
      orthoRef.current.zoom = 10;
      orthoRef.current.updateProjectionMatrix();
    }

    const cam = cameraType === 'perspective' ? perspectiveRef.current : orthoRef.current;
    if (cam) {
      set({ camera: cam }); // Tell R3F to use this camera
      setCamera(cam);       // Update global context
    }
  }, [cameraType, set, setCamera, size]);

  return null; // no JSX
}
