import { useThree } from '@react-three/fiber';
import { useContext, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { CameraContext } from './CameraContext';

export default function CustomCamera() {
  const { setCamera, cameraType } = useContext(CameraContext);
  const { set, size, scene } = useThree();
  const perspectiveRef = useRef<THREE.PerspectiveCamera>(null);
  const orthoRef = useRef<THREE.OrthographicCamera>(null);

  useEffect(() => {
    const aspect = size.width / size.height;

    // Create cameras
    if (!perspectiveRef.current) {
      perspectiveRef.current = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000);
    }

    if (!orthoRef.current) {
      const d = 1; // temp, will be updated after fit
      orthoRef.current = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 2000);
    }

    const cam = cameraType === 'perspective' ? perspectiveRef.current : orthoRef.current;
    if (!cam) return;

    // Fit camera to scene
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    const sizeBox = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(sizeBox);

    const maxDim = Math.max(sizeBox.x, sizeBox.y, sizeBox.z);
    const fitOffset = 1.2;

    if (cameraType === 'perspective' && perspectiveRef.current) {
      const fov = perspectiveRef.current.fov * (Math.PI / 180);
      const distance = (maxDim / 2) / Math.tan(fov / 2) * fitOffset;

      const direction = new THREE.Vector3(1, 1, 1).normalize(); // Diagonal view
      perspectiveRef.current.position.copy(center).addScaledVector(direction, distance);
      perspectiveRef.current.lookAt(center);
      perspectiveRef.current.updateProjectionMatrix();
    }

    if (cameraType === 'orthographic' && orthoRef.current) {
      const d = maxDim * fitOffset;
      orthoRef.current.left = (-d * aspect) / 2;
      orthoRef.current.right = (d * aspect) / 2;
      orthoRef.current.top = d / 2;
      orthoRef.current.bottom = -d / 2;
      orthoRef.current.position.set(center.x + maxDim, center.y + maxDim, center.z + maxDim);
      orthoRef.current.lookAt(center);
      orthoRef.current.updateProjectionMatrix();
    }

    // Set as active camera
    set({ camera: cam });
    setCamera(cam);
  }, [cameraType, set, setCamera, size, scene]);

  return null;
}
