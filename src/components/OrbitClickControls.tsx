import { OrbitControls } from '@react-three/drei'
import { useFrame,useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function OrbitClickControls() {
  const { camera, gl, scene } = useThree()
  const controlsRef = useRef<any>(null);
  const raycaster = useRef(new THREE.Raycaster())
  const pointer = new THREE.Vector2()

  const [helperVisible, setHelperVisible] = useState(true)
  const [helperOpacity, setHelperOpacity] = useState(1)
  const helperRef = useRef<THREE.Mesh>(null)
  const fadeTimeout = useRef<number | null>(null)

  const targetPoint = useRef<THREE.Vector3 | null>(null)
  const easingSpeed = 0.1
  const cameraLerpTarget = useRef<THREE.Vector3 | null>(null)

  const setOrbitTarget = (screenX: number, screenY: number, zoomToTarget: boolean) => {
    pointer.x = (screenX / window.innerWidth) * 2 - 1
    pointer.y = -(screenY / window.innerHeight) * 2 + 1

    raycaster.current.setFromCamera(pointer, camera)
    const intersects = raycaster.current.intersectObjects(scene.children, true)

    if (intersects.length > 0 && controlsRef.current) {
      const hit = intersects[0].point.clone()
      targetPoint.current = hit

      if (zoomToTarget) {
        const dir = new THREE.Vector3()
        camera.getWorldDirection(dir)
        cameraLerpTarget.current = hit.clone().sub(dir.multiplyScalar(10)) // Move camera back 10 units from the hit point
      }

      // Show fading helper
      if (helperRef.current) {
        helperRef.current.position.copy(hit)
         helperRef.current.updateMatrixWorld()
        setHelperVisible(true)
        setHelperOpacity(1)

        if (fadeTimeout.current) clearTimeout(fadeTimeout.current)
        fadeTimeout.current = window.setTimeout(() => {
          let fade = 1
          const fadeInterval = setInterval(() => {
            fade -= 0.05
            setHelperOpacity(Math.max(fade, 0))
            if (fade <= 0) {
              setHelperVisible(true)
              clearInterval(fadeInterval)
            }
          }, 50)
        }, 1000)
      }
    }
  }

  useEffect(() => {
    const dom = gl.domElement

    const onClick = (e: MouseEvent) => {
      if (e.detail === 1) {
        setTimeout(() => {
          if (e.detail === 1) setOrbitTarget(e.clientX, e.clientY, false)
        }, 200)
      }
    }

    const onDoubleClick = (e: MouseEvent) => {
      setOrbitTarget(e.clientX, e.clientY, true)
    }

    dom.addEventListener('click', onClick)
    dom.addEventListener('dblclick', onDoubleClick)

    return () => {
      dom.removeEventListener('click', onClick)
      dom.removeEventListener('dblclick', onDoubleClick)
    }
  }, [camera, scene, gl])

  useFrame(() => {
    if (targetPoint.current && controlsRef.current) {
      controlsRef.current.target.lerp(targetPoint.current, easingSpeed)
      controlsRef.current.update()

      if (controlsRef.current.target.distanceTo(targetPoint.current) < 0.001) {
        controlsRef.current.target.copy(targetPoint.current)
        targetPoint.current = null
      }
    }

    if (cameraLerpTarget.current) {
      camera.position.lerp(cameraLerpTarget.current, easingSpeed)
      if (camera.position.distanceTo(cameraLerpTarget.current) < 0.01) {
        camera.position.copy(cameraLerpTarget.current)
        cameraLerpTarget.current = null
      }
    }
  })

  return (
    <>
      <OrbitControls
      ref={controlsRef}
      enableDamping={false}
      dampingFactor={0.1}
      rotateSpeed={0.5}
      panSpeed={0.5}
      minPolarAngle={0}               // ← allow orbiting from the bottom
      maxPolarAngle={Math.PI}         // ← allow orbiting all the way to the top
      enableZoom={true}               // optional: allow zoom
      enablePan={true}  
      screenSpacePanning={false}
    />
      {helperVisible && (
        <mesh ref={helperRef}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="red" transparent opacity={helperOpacity} />
        </mesh>
      )}
    </>
  )
}
