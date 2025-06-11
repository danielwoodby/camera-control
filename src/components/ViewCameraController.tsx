import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface Props {
  view: string;
  controls?: OrbitControlsImpl | null;
}

export default function ViewCameraController({ view, controls }: Props) {
  const { camera } = useThree();

  useEffect(() => {
    const distance = 50;
    const target = new THREE.Vector3(0, 0, 0);
    const position = new THREE.Vector3();

    switch (view) {
      case 'front':
        position.set(0, 0, -distance);
        break;
      case 'back':
        position.set(0, 0, distance);
        break;
      case 'left':
        position.set(-distance, 0, 0);
        break;
      case 'right':
        position.set(distance, 0, 0);
        break;
      case 'top':
        position.set(0, distance, 0);
        break;
      case 'bottom':
        position.set(0, -distance, 0);
        break;
      default:
        return;
    }

    camera.position.copy(position);
    camera.lookAt(target);
    controls?.target.copy(target);
    controls?.update();
  }, [view]);

  return null;
}
