// Scene.tsx
import { useLoader, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import { useContext, useEffect } from 'react'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'
import { GLTFLoader } from 'three-stdlib'

import { useCameraControl } from '../useCameraControl'
import { CameraContext } from './CameraContext'
import PivotDragControls from './PivotDragControls';

function frameObject(object: THREE.Object3D, camera: THREE.Camera) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = perspectiveCamera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

    perspectiveCamera.position.set(center.x - 30, center.y + 50, -cameraZ);
    perspectiveCamera.lookAt(center);
  } else if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
    const orthoCamera = camera as THREE.OrthographicCamera;

    const aspect = orthoCamera.right / orthoCamera.top;
    const d = Math.max(size.x, size.y, size.z);

    orthoCamera.left = -d * aspect;
    orthoCamera.right = d * aspect;
    orthoCamera.top = d;
    orthoCamera.bottom = -d;
    orthoCamera.position.set(center.x - 30, center.y + 50, center.z + 100);
    orthoCamera.lookAt(center);
    orthoCamera.updateProjectionMatrix();
  }
}

function Model({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url)
  const { camera } = useContext(CameraContext)

  useEffect(() => {
    if (!camera) return
    frameObject(gltf.scene, camera)
  }, [gltf, camera])

  return <primitive object={gltf.scene} scale={1} position={[0, 0, 0]} />
}

export default function Scene() {
  const { gl, scene } = useThree()
  const { camera, setCamera } = useContext(CameraContext)
  const hdrTexture = useLoader(RGBELoader, '/hdr/brown_photostudio_01_1k.hdr')
  const { registerCameraUpdater } = useCameraControl()

  // Setup HDR environment
  useEffect(() => {
    if (!hdrTexture) return

    hdrTexture.mapping = THREE.EquirectangularReflectionMapping
    const pmremGenerator = new THREE.PMREMGenerator(gl)
    pmremGenerator.compileEquirectangularShader()

    const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture
    scene.environment = envMap
    scene.background = null

    return () => {
      scene.environment = null
      scene.background = null
      envMap.dispose();
      hdrTexture.dispose()
      pmremGenerator.dispose()
    }
  }, [hdrTexture, gl, scene])

  // Store the camera reference globally in context when it changes
  useEffect(() => {
    if (camera) setCamera(camera)
  }, [camera, setCamera])

  // Register camera update logic for smooth transitions
  useEffect(() => {
    if (!camera) return

    const updater = (
      targetPosition: THREE.Vector3,
      upVector: THREE.Vector3,
      duration: number,
      lookAt?: THREE.Vector3
    ) => {
      gsap.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: duration / 1000,
        ease: 'power3.inOut',
        onUpdate: () => {
          camera.updateProjectionMatrix()
        }
      })

      if (lookAt) {
        const startLookAt = new THREE.Vector3()
        camera.getWorldDirection(startLookAt)
        const endLookAt = lookAt.clone().sub(camera.position).normalize()

        const t = { alpha: 0 }
        gsap.to(t, {
          alpha: 1,
          duration: duration / 1000,
          ease: 'power3.inOut',
          onUpdate: () => {
            const dir = startLookAt.clone().lerp(endLookAt, t.alpha)
            const target = camera.position.clone().add(dir)
            camera.lookAt(target)
          }
        })
      }

      camera.up.copy(upVector)
    }

    registerCameraUpdater(updater)
  }, [camera, registerCameraUpdater])

  return (
    <>
      <Model url="/models/turtle.glb" />
      <PivotDragControls/>
    </>
  )
}
