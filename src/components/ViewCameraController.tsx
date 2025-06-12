import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

export default function ViewCameraController({ view }: { view: string }) {
  const { camera, scene, size } = useThree();

  useEffect(() => {
    // 1. Get bounding box of the scene
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    const sizeVec = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(sizeVec);

    // 2. Determine view direction
    const direction = new THREE.Vector3();
    switch (view) {
      case 'front':
        direction.set(0, 0, -1);
        break;
      case 'back':
        direction.set(0, 0, 1);
        break;
      case 'left':
        direction.set(-1, 0, 0);
        break;
      case 'right':
        direction.set(1, 0, 0);
        break;
      case 'top':
        direction.set(0, 1, 0);
        break;
      case 'bottom':
        direction.set(0, -1, 0);
        break;
      default:
        direction.set(1, 1, 1).normalize();
    }

    // 3. Fit logic
    const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
    const fitOffset = 2.0;

    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const perspectiveCamera = camera as THREE.PerspectiveCamera;
      const fov = perspectiveCamera.fov * (Math.PI / 180);
      const distance = (maxDim / 2) / Math.tan(fov / 2) * fitOffset;

      const position = center.clone().addScaledVector(direction, distance);
      perspectiveCamera.position.copy(position);
      perspectiveCamera.lookAt(center);
    }

    if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      const orthographicCamera = camera as THREE.OrthographicCamera;
      const boxSize = sizeVec.clone().multiplyScalar(fitOffset);

      if (view === 'left' || view === 'right') {
        orthographicCamera.top = boxSize.y / 2;
        orthographicCamera.bottom = -boxSize.y / 2;
        orthographicCamera.left = -boxSize.z / 2;
        orthographicCamera.right = boxSize.z / 2;
      } else if (view === 'top' || view === 'bottom') {
        orthographicCamera.top = boxSize.z / 2;
        orthographicCamera.bottom = -boxSize.z / 2;
        orthographicCamera.left = -boxSize.x / 2;
        orthographicCamera.right = boxSize.x / 2;
      } else {
        orthographicCamera.top = boxSize.y / 2;
        orthographicCamera.bottom = -boxSize.y / 2;
        orthographicCamera.left = -boxSize.x / 2;
        orthographicCamera.right = boxSize.x / 2;
      }

      const position = center.clone().addScaledVector(direction, maxDim * fitOffset);
      orthographicCamera.position.copy(position);
      orthographicCamera.lookAt(center);
      orthographicCamera.updateProjectionMatrix();
    }
  }, [view, camera, scene, size]);

  return null;
}
