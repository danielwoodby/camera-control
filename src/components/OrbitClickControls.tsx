//OrbitClickControls.tsx
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export default function OrbitClickControls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const raycaster = useRef(new THREE.Raycaster())
  const pointer = new THREE.Vector2()
  const { camera, scene, gl } = useThree()

  const [helperVisible, setHelperVisible] = useState(true)
  const [helperOpacity, setHelperOpacity] = useState(1)
  const helperRef = useRef<THREE.Mesh>(null)
  const fadeTimeout = useRef<number | null>(null)
  const clickTimeout = useRef<number | null>(null)

  const targetPoint = useRef<THREE.Vector3 | null>(null)
  const easingSpeed = 0.1
  const cameraLerpTarget = useRef<THREE.Vector3 | null>(null)

  const [interactionEnabled, setInteractionEnabled] = useState(true)
  const listenersRef = useRef<{ click: (e: MouseEvent) => void; dblclick: (e: MouseEvent) => void } | null>(null)


  const setOrbitTarget = (screenX: number, screenY: number, zoomToTarget: boolean) => {
    pointer.x = (screenX / window.innerWidth) * 2 - 1
    pointer.y = -(screenY / window.innerHeight) * 2 + 1

    raycaster.current.setFromCamera(pointer, camera)
    const intersects = raycaster.current.intersectObjects(scene.children, true).filter(obj => obj.object !== helperRef.current)

    if (intersects.length > 0 && controlsRef.current) {
      const hit = intersects[0].point.clone()
      targetPoint.current = hit

      if (zoomToTarget) {
        const dir = new THREE.Vector3()
        camera.getWorldDirection(dir)
        cameraLerpTarget.current = hit.clone().sub(dir.multiplyScalar(10))
      }

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
        }, 500)
      }
    }
  }


const addListeners = () => {
  if (!listenersRef.current) {
    const click = (e: MouseEvent) => {
      // Start a timeout; if dblclick comes, we cancel it
      clickTimeout.current = window.setTimeout(() => {
        setOrbitTarget(e.clientX, e.clientY, false)
        clickTimeout.current = null
      }, 200) // 200ms is safe between click and dblclick
    }

    const dblclick = (e: MouseEvent) => {
      // Cancel pending single-click
      if (clickTimeout.current !== null) {
        clearTimeout(clickTimeout.current)
        clickTimeout.current = null
      }

      setOrbitTarget(e.clientX, e.clientY, true)
    }

    gl.domElement.addEventListener('click', click)
    gl.domElement.addEventListener('dblclick', dblclick)
    listenersRef.current = { click, dblclick }
    setInteractionEnabled(true)
  }
}


  const removeListeners = () => {
    if (listenersRef.current) {
      gl.domElement.removeEventListener('click', listenersRef.current.click)
      gl.domElement.removeEventListener('dblclick', listenersRef.current.dblclick)
      listenersRef.current = null
      setInteractionEnabled(false)
    }
  }

  useEffect(() => {
    addListeners()
    return () => {
      removeListeners()
    }
  }, [])

  useFrame(() => {
    let isMoving = false

    if (targetPoint.current && controlsRef.current) {
      controlsRef.current.target.lerp(targetPoint.current, easingSpeed)
      controlsRef.current.update()

      if (controlsRef.current.target.distanceTo(targetPoint.current) < 0.001) {
        controlsRef.current.target.copy(targetPoint.current)
        targetPoint.current = null
      } else {
        isMoving = true
      }
    }

    if (cameraLerpTarget.current) {
      camera.position.lerp(cameraLerpTarget.current, easingSpeed)
      if (camera.position.distanceTo(cameraLerpTarget.current) < 0.01) {
        camera.position.copy(cameraLerpTarget.current)
        cameraLerpTarget.current = null
      } else {
        isMoving = true
      }
    }

    if (cameraLerpTarget.current === null && controlsRef.current && targetPoint.current === null) {
  controlsRef.current.update(); // Ensure controls lock to the latest state
}
    // Manage interactions and orbit control enablement
    if (isMoving) {
      if (controlsRef.current) controlsRef.current.enabled = false
      if (interactionEnabled) removeListeners()
    } else {
      if (controlsRef.current) controlsRef.current.enabled = true
      if (!interactionEnabled) addListeners()
    }
  })

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping={false}
        // dampingFactor={0.1}
        // rotateSpeed={0.5}
        // panSpeed={0.5}
        // enablePan={false}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        enableZoom={true}
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
