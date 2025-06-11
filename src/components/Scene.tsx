import { useLoader, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'
import { GLTFLoader } from 'three-stdlib'

import OrbitClickControls from './OrbitClickControls'

function Model({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url)
  return <primitive object={gltf.scene} scale={1} position={[0, 0, 0]} />
}

export default function Scene() {
  const { scene, gl } = useThree()
  const hdrTexture = useLoader(RGBELoader, '/hdr/brown_photostudio_01_1k.hdr')

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
      hdrTexture.dispose()
      envMap.dispose()
      pmremGenerator.dispose()
    }
  }, [hdrTexture, gl, scene])

  return (
    <>
      <Model url="/models/turtle.glb" />
      <OrbitClickControls />
    </>
  )
}
