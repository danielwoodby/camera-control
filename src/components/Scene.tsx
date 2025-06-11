//Scene.tsx
import { useLoader, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import { useContext, useEffect } from 'react'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'
import { GLTFLoader } from 'three-stdlib'

import { useCameraControl } from '../useCameraControl'
import { CameraContext } from './CameraContext'
import OrbitClickControls from './OrbitClickControls'

function Model({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url)
  return <primitive object={gltf.scene} scale={1} position={[0, 0, 0]} />
}

export default function Scene() {
  const { camera, gl, scene } = useThree()
  const hdrTexture = useLoader(RGBELoader, '/hdr/brown_photostudio_01_1k.hdr')
  const { setCamera } = useContext(CameraContext)
  const { registerCameraUpdater } = useCameraControl()

  // Store the camera reference globally
  useEffect(() => {
    if (camera) setCamera(camera)
  }, [camera, setCamera])

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

  // Register camera update logic
  useEffect(() => {
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
      <OrbitClickControls />
      <Model url="/models/turtle.glb" />
    </>
  )
}
