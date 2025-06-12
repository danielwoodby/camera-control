import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function PivotDragControls() {
  const { camera, gl, scene } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const pointer = new THREE.Vector2()

  const activeMeshRef = useRef<THREE.Object3D | null>(null)
  const pivotPoint = useRef<THREE.Vector3 | null>(null)
  const isDragging = useRef(false)
  const isSurfaceHit = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const helperRef = useRef<THREE.Mesh>(null)
  const axesHelperRef = useRef<THREE.AxesHelper>(null)

  const zoomTarget = useRef<THREE.Vector3 | null>(null)
  const zoomSpeed = 0.1
  const minDistance = 5
  const maxDistance = 100

  function getRootObject(object: THREE.Object3D): THREE.Object3D {
    while (object.parent && !(object.parent instanceof THREE.Scene)) {
      object = object.parent
    }
    return object
  }

  const onMouseDown = (e: MouseEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1

    raycaster.current.setFromCamera(pointer, camera)

    // Filter out helper objects
    const excludedObjects: (THREE.Object3D | null)[] = [helperRef.current, axesHelperRef.current]
    const selectableObjects: THREE.Mesh[] = []
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !excludedObjects.includes(child)) {
        selectableObjects.push(child as THREE.Mesh)
      }
    })

    const intersects = raycaster.current.intersectObjects(selectableObjects, true)

    if (intersects.length > 0) {
      const { object, point } = intersects[0]
      const rootObject = getRootObject(object)

      activeMeshRef.current = rootObject
      pivotPoint.current = point.clone()
      isDragging.current = true
      isSurfaceHit.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }

      if (helperRef.current) {
        helperRef.current.position.copy(point)
        helperRef.current.visible = true
      }

      if (axesHelperRef.current) {
        axesHelperRef.current.position.copy(point)
        axesHelperRef.current.visible = true
      }

      console.log('Selected object at point:', rootObject.name || rootObject.type)
    } else {
      // Fallback: rotate closest mesh around its center
      let closest: THREE.Object3D | null = null
      let closestDistance = Infinity
      const cameraPos = camera.position

      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && !excludedObjects.includes(child)) {
          const box = new THREE.Box3().setFromObject(child)
          const center = new THREE.Vector3()
          box.getCenter(center)
          const distance = cameraPos.distanceTo(center)
          if (distance < closestDistance) {
            closest = child
            closestDistance = distance
          }
        }
      })

      if (closest) {
        const rootObject = getRootObject(closest)
        activeMeshRef.current = rootObject

        const box = new THREE.Box3().setFromObject(closest)
        const center = new THREE.Vector3()
        box.getCenter(center)

        pivotPoint.current = center
        isDragging.current = true
        isSurfaceHit.current = false
        lastMouse.current = { x: e.clientX, y: e.clientY }

        if (helperRef.current) {
          helperRef.current.position.copy(center)
          helperRef.current.visible = true
        }

        if (axesHelperRef.current) {
          axesHelperRef.current.position.copy(center)
          axesHelperRef.current.visible = true
        }

        console.log('Fallback to mesh center:', rootObject.name || rootObject.type)
      }
    }
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !activeMeshRef.current || !pivotPoint.current) return

    const deltaX = e.clientX - lastMouse.current.x
    const deltaY = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }

    const rotationSpeed = 0.01
    const angleY = deltaX * rotationSpeed
    const angleX = deltaY * -rotationSpeed

    let axisY: THREE.Vector3
    let axisX: THREE.Vector3

    if (isSurfaceHit.current) {
      const parent = activeMeshRef.current.parent
      if (!parent) return

      const inverseQuat = parent.getWorldQuaternion(new THREE.Quaternion()).invert()
      axisY = new THREE.Vector3(0, 1, 0).applyQuaternion(inverseQuat).normalize()
      axisX = new THREE.Vector3(1, 0, 0).applyQuaternion(inverseQuat).normalize()
    } else {
      axisY = new THREE.Vector3(0, 1, 0)
      axisX = new THREE.Vector3(1, 0, 0)
    }

    rotateAroundWorldPoint(activeMeshRef.current, pivotPoint.current, axisY, angleY)
    rotateAroundWorldPoint(activeMeshRef.current, pivotPoint.current, axisX, angleX)
  }

  const onMouseUp = () => {
    isDragging.current = false
  }

  const onWheel = (e: WheelEvent) => {
    if (!pivotPoint.current) return

    const direction = new THREE.Vector3().subVectors(pivotPoint.current, camera.position).normalize()
    const currentDistance = camera.position.distanceTo(pivotPoint.current)
    const zoomAmount = e.deltaY * 0.1

    let newDistance = currentDistance + zoomAmount
    newDistance = Math.min(Math.max(newDistance, minDistance), maxDistance)

    const newTarget = new THREE.Vector3().copy(pivotPoint.current).addScaledVector(direction.negate(), newDistance)

    zoomTarget.current = newTarget
  }

  useEffect(() => {
    const dom = gl.domElement
    dom.addEventListener('mousedown', onMouseDown)
    dom.addEventListener('mousemove', onMouseMove)
    dom.addEventListener('mouseup', onMouseUp)
    dom.addEventListener('wheel', onWheel)

    return () => {
      dom.removeEventListener('mousedown', onMouseDown)
      dom.removeEventListener('mousemove', onMouseMove)
      dom.removeEventListener('mouseup', onMouseUp)
      dom.removeEventListener('wheel', onWheel)
    }
  }, [gl, scene])

  useFrame(() => {
    if (!zoomTarget.current) return

    const direction = new THREE.Vector3().subVectors(zoomTarget.current, camera.position)
    const distance = direction.length()

    if (distance < 0.01) {
      zoomTarget.current = null
      return
    }

    direction.normalize()
    camera.position.addScaledVector(direction, distance * zoomSpeed)
    camera.updateProjectionMatrix()
  })

  return (
    <>
      <mesh ref={helperRef} visible={false}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <primitive object={new THREE.AxesHelper(2)} ref={axesHelperRef} visible={false} />
    </>
  )
}

// Helper function
function rotateAroundWorldPoint(
  mesh: THREE.Object3D,
  point: THREE.Vector3,
  axis: THREE.Vector3,
  angle: number
) {
  const parent = mesh.parent
  if (!parent) return

  const pivotLocal = point.clone()
  parent.worldToLocal(pivotLocal)

  // Move to pivot origin
  mesh.position.sub(pivotLocal)

  // Rotate
  const quaternion = new THREE.Quaternion().setFromAxisAngle(axis.normalize(), angle)
  mesh.position.applyQuaternion(quaternion)
  mesh.quaternion.premultiply(quaternion)

  // Move back
  mesh.position.add(pivotLocal)

  mesh.updateMatrixWorld(true)
}
