import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

const SKYBOX_FACES = ["px", "nx", "py", "ny", "pz", "nz"] as const;

/**
 * Owns the Three.js scene, camera, renderer and controls and renders strictly
 * on demand: a frame is drawn only when something requests it (camera/gizmo
 * interaction, data changes, async asset loads), never in a perpetual loop.
 */
export class Renderer {
  readonly scene = new THREE.Scene();
  readonly selectableGroup = new THREE.Group();

  readonly #container: HTMLElement;
  readonly #renderer: THREE.WebGLRenderer;
  readonly #camera: THREE.PerspectiveCamera;
  readonly #controls: OrbitControls;
  readonly #transformControls: TransformControls;
  readonly #selectionBox = new THREE.BoxHelper(new THREE.Object3D());
  readonly #directionalLight: THREE.DirectionalLight;

  #renderScheduled = false;

  constructor(container: HTMLElement, staticUrl = "/static/") {
    this.#container = container;

    this.#camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 2000);
    this.#camera.position.set(130, 50, 0);

    this.#renderer = new THREE.WebGLRenderer({ antialias: true });
    this.#renderer.shadowMap.enabled = true;
    this.#renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.#renderer.domElement);

    this.#setupEnvironment(staticUrl);

    this.#directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    this.#directionalLight.position.set(360, 400, 800);
    this.#directionalLight.castShadow = true;
    // 4096^2 keeps shadows crisp at ~64 MB of VRAM (the old 16384^2 map needed
    // ~1 GB and exceeded many GPUs' limits).
    this.#directionalLight.shadow.mapSize.set(4096, 4096);
    Object.assign(this.#directionalLight.shadow.camera, { top: 200, bottom: -200, left: 400, right: -400, far: 2000 });
    this.scene.add(this.#directionalLight);

    this.#selectionBox.visible = false;
    this.scene.add(this.#selectionBox);
    this.selectableGroup.name = "selectableGroup";
    this.scene.add(this.selectableGroup);

    this.#transformControls = new TransformControls(this.#camera, this.#renderer.domElement);
    this.scene.add(this.#transformControls.getHelper());

    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
    this.#controls.screenSpacePanning = false;
    this.#controls.maxDistance = 500;
    this.#controls.minDistance = 10;
    this.#controls.maxPolarAngle = Math.PI / 2 - 0.02;

    this.#setupRenderTriggers();
    window.addEventListener("resize", () => this.onResize());
    this.requestRender();
  }

  get camera(): THREE.PerspectiveCamera {
    return this.#camera;
  }

  get controls(): OrbitControls {
    return this.#controls;
  }

  get transformControls(): TransformControls {
    return this.#transformControls;
  }

  get domElement(): HTMLCanvasElement {
    return this.#renderer.domElement;
  }

  /** Add an object to the selectable group. */
  add(object: THREE.Object3D): void {
    this.selectableGroup.add(object);
    this.requestRender();
  }

  /** Remove an object from the selectable group. */
  remove(object: THREE.Object3D): void {
    this.selectableGroup.remove(object);
    this.requestRender();
  }

  /** Show the selection box around an object, or hide it when null. */
  setSelection(object: THREE.Object3D | null): void {
    if (object) {
      this.#selectionBox.setFromObject(object);
      this.#selectionBox.visible = true;
    } else {
      this.#selectionBox.visible = false;
    }
    this.requestRender();
  }

  setShadows(enabled: boolean): void {
    this.#renderer.shadowMap.enabled = enabled;
    this.#directionalLight.castShadow = enabled;
    this.requestRender();
  }

  setFog(enabled: boolean): void {
    this.scene.fog = enabled ? new THREE.Fog(0xdde0e0, 100, 2200) : null;
    this.requestRender();
  }

  /** Coalesced render request: at most one draw per animation frame. */
  requestRender(): void {
    if (this.#renderScheduled) {
      return;
    }
    this.#renderScheduled = true;
    requestAnimationFrame(() => {
      this.#renderScheduled = false;
      this.#render();
    });
  }

  onResize(): void {
    const { clientWidth, clientHeight } = this.#container;
    this.#camera.aspect = clientWidth / clientHeight;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(clientWidth, clientHeight);
    this.requestRender();
  }

  #render(): void {
    if (this.#selectionBox.visible) {
      this.#selectionBox.update();
    }
    this.#renderer.render(this.scene, this.#camera);
  }

  #setupRenderTriggers(): void {
    const request = (): void => this.requestRender();
    this.#controls.addEventListener("change", request);
    this.#transformControls.addEventListener("change", request);
    this.#transformControls.addEventListener("objectChange", request);
    // Disable orbiting while dragging the gizmo.
    this.#transformControls.addEventListener("dragging-changed", (event) => {
      this.#controls.enabled = !event.value;
    });
  }

  #setupEnvironment(staticUrl: string): void {
    const skybox = new THREE.CubeTextureLoader().load(
      SKYBOX_FACES.map((face) => `${staticUrl}img/skybox/${face}.png`),
      () => this.requestRender(),
    );
    this.scene.background = skybox;
    this.scene.fog = new THREE.Fog(0xdde0e0, 100, 2200);

    this.scene.add(new THREE.HemisphereLight());

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshStandardMaterial({ color: 0x4f7942 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }
}
