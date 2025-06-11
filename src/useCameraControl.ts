// useCameraControl.ts
import { useCallback, useRef } from "react";
import * as THREE from "three";

// Interface for the camera updater function
export type CameraUpdater = (
  targetPosition: THREE.Vector3,
  upVector: THREE.Vector3,
  duration: number,
  lookAt?: THREE.Vector3,
) => void;

/**
 * Custom hook to control camera across component boundaries
 * This allows a parent component to control the camera inside a child component
 */
export function useCameraControl() {
  // Reference to hold the camera update function
  const updateCameraRef = useRef<CameraUpdater | null>(null);

  // Function to register a camera updater function
  const registerCameraUpdater = useCallback((updater: CameraUpdater) => {
    updateCameraRef.current = updater;
  }, []);

  // Function to update the camera using the registered updater
  const updateCamera = useCallback(
    (
      targetPosition: THREE.Vector3,
      upVector: THREE.Vector3,
      duration: number,
      lookAt?: THREE.Vector3,
    ) => {
      if (updateCameraRef.current) {
        updateCameraRef.current(targetPosition, upVector, duration, lookAt);
        return true;
      }

      console.warn("[Camera Debug] Camera updater not registered yet");
      return false;
    },
    [],
  );

  return {
    registerCameraUpdater,
    updateCamera,
  };
}
