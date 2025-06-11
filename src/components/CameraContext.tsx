import { createContext } from 'react'
import * as THREE from "three";

type Camera = THREE.PerspectiveCamera | THREE.OrthographicCamera | null

export const CameraContext = createContext<
  [Camera, React.Dispatch<React.SetStateAction<Camera>>]
>([null, () => {}])// eslint-disable-line @typescript-eslint/no-empty-function
