import { useFrame,useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function PivotDragControls() {
  const { camera, gl, scene } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const pointer = new THREE.Vector2()

  const activeMeshRef = useRef<THREE.Object3D | null>(null)
  const pivotPoint = useRef<THREE.Vector3 | null>(null)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const helperRef = useRef<THREE.Mesh>(null)
  const axesHelperRef = useRef<THREE.AxesHelper>(null)

  const zoomTarget = useRef<THREE.Vector3 | null>(null)
  const zoomSpeed = 0.1

  // Zoom limits:
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
    const intersects = raycaster.current.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      const { object, point } = intersects[0]
      const rootObject = getRootObject(object)

      // setActiveMesh(rootObject) // Removed undefined function
      activeMeshRef.current = rootObject
      pivotPoint.current = point.clone()
      lastMouse.current = { x: e.clientX, y: e.clientY }
      isDragging.current = true
      if (helperRef.current) {
        helperRef.current.position.copy(point)
        helperRef.current.visible = true
      }

      if (axesHelperRef.current) {
        axesHelperRef.current.position.copy(point)
        axesHelperRef.current.visible = true
      }

      console.log('Selected object:', rootObject.name || rootObject.type)
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

    rotateAroundWorldPoint(
      activeMeshRef.current,
      pivotPoint.current,
      new THREE.Vector3(0, 1, 0), // Horizontal (Y-axis)
      angleY
    )

    rotateAroundWorldPoint(
      activeMeshRef.current,
      pivotPoint.current,
      new THREE.Vector3(1, 0, 0), // Vertical (X-axis)
      angleX
    )
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

    // Calculate new target position at clamped distance
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

  // Animate smooth zoom
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
      {/* Red pivot sphere */}
      <mesh ref={helperRef} visible={false}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="red" />
      </mesh>

      {/* Axes Helper */}
      <primitive object={new THREE.AxesHelper(2)} ref={axesHelperRef} visible={false} />
    </>
  )
}

// Rotation helper function
function rotateAroundWorldPoint(
  mesh: THREE.Object3D,
  point: THREE.Vector3,
  axis: THREE.Vector3,
  angle: number
) {
  const worldAxis = axis.clone().normalize()

  const translation1 = new THREE.Matrix4().makeTranslation(
    -point.x,
    -point.y,
    -point.z
  )
  const rotation = new THREE.Matrix4().makeRotationAxis(worldAxis, angle)
  const translation2 = new THREE.Matrix4().makeTranslation(
    point.x,
    point.y,
    point.z
  )

  const transform = new THREE.Matrix4()
    .multiply(translation2)
    .multiply(rotation)
    .multiply(translation1)

  mesh.applyMatrix4(transform)
  mesh.updateMatrixWorld(true)
}
