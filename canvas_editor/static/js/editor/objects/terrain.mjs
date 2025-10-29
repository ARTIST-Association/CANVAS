import * as THREE from "three";
import { Object3D } from "three";

/**
 * Creates the terrain for the scene
 */
export class Terrain extends Object3D {
  /**
   * Creates a new terrain.
   * @param {number} size the size of the terrain.
   */
  constructor(size) {
    super();

    this.terrain = new THREE.Mesh(
      new THREE.CircleGeometry(size / 2),
      new THREE.MeshStandardMaterial({
        color: 0x5fd159,
      }),
    );
    this.terrain.receiveShadow = true;
    this.terrain.rotateX((3 * Math.PI) / 2);
    this.add(this.terrain);

    this.mountains = new THREE.Group();
    this.add(this.mountains);
    for (let i = 0; i < 100; i++) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(THREE.MathUtils.randFloat(20, 100)),
        new THREE.MeshStandardMaterial({
          color: 0x50ba78,
        }),
      );
      sphere.position.set(
        (size / 2) * Math.sin((i / 100) * 2 * Math.PI),
        0,
        (size / 2) * Math.cos((i / 100) * 2 * Math.PI),
      );
      this.mountains.add(sphere);
    }
  }
}
