import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { MeshDescriptor, PrimitiveShape } from "@/core/types";

// Each GLB is fetched and parsed at most once; every object reuses it via a
// lightweight clone that shares geometry/materials (carried over from the perf
// work on the previous branch).
const gltfCache = new Map<string, Promise<THREE.Object3D>>();
const loader = new GLTFLoader();

function loadGltf(url: string, castShadow: boolean): Promise<THREE.Object3D> {
  let scenePromise = gltfCache.get(url);
  if (!scenePromise) {
    scenePromise = loader.loadAsync(url).then((gltf) => gltf.scene);
    scenePromise.catch(() => gltfCache.delete(url));
    gltfCache.set(url, scenePromise);
  }
  return scenePromise.then((scene) => {
    const mesh = scene.clone(true);
    if (castShadow) {
      mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
        }
      });
    }
    return mesh;
  });
}

function buildGeometry(shape: PrimitiveShape, size: number): THREE.BufferGeometry {
  switch (shape) {
    case "sphere":
      return new THREE.SphereGeometry(size, 32, 16);
    case "box":
      return new THREE.BoxGeometry(size, size, size);
    case "octahedron":
      return new THREE.OctahedronGeometry(size);
    case "cone":
      return new THREE.ConeGeometry(size, size * 2, 32);
  }
}

function buildPrimitive(shape: PrimitiveShape, size: number, color: string): THREE.Mesh {
  const mesh = new THREE.Mesh(buildGeometry(shape, size), new THREE.MeshStandardMaterial({ color }));
  mesh.castShadow = true;
  return mesh;
}

/**
 * Build the Three.js representation for a mesh descriptor.
 *
 * Returns a group immediately; for GLB meshes the geometry is attached
 * asynchronously and `onReady` fires once it is in the scene (so the caller can
 * request an on-demand render).
 */
export function buildMesh(descriptor: MeshDescriptor, onReady?: () => void): THREE.Group {
  const group = new THREE.Group();
  if (descriptor.kind === "glb") {
    void loadGltf(descriptor.url, descriptor.castShadow ?? false).then((mesh) => {
      group.add(mesh);
      onReady?.();
    });
  } else {
    group.add(buildPrimitive(descriptor.shape, descriptor.size, descriptor.color));
    onReady?.();
  }
  return group;
}
