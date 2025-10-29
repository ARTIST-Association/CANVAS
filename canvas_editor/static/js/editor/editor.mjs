import * as THREE from "three";
import { ViewHelper } from "compass";
import { UndoRedoHandler } from "undoRedoHandler";
import { SaveAndLoadHandler } from "saveAndLoadHandler";
import { Navbar } from "navbar";
import { OverviewHandler } from "overview";
import { Picker } from "picker";
import { ProjectSettingsManager } from "projectSettingsManager";
import { ObjectManager } from "objectManager";
import { QuickSelector } from "quickSelector";
import { JobInterface } from "jobInterface";
import { Inspector } from "inspectorClass";
import { CommandPrompt } from "commandPrompt";
import { PreviewHandler } from "previewHandler";
import { ModeSelector } from "modeSelector";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LightSource } from "lightSource";
import { Receiver } from "receiver";
import { Terrain } from "terrain";
import { Heliostat } from "heliostat";
import { projectIdRequiredError } from "message_dict";
import {
  skyboxNxPath,
  skyboxNyPath,
  skyboxNzPath,
  skyboxPxPath,
  skyboxPyPath,
  skyboxPzPath,
} from "path_dict";

/**
 * Represents the main editor class.
 * @class Editor
 * @classdesc This is the main class of the editor. It holds all the other classes and manages the threejs scene.
 */
export class Editor {
  /** @type {Editor} */
  static #instance;
  #undoRedoHandler;
  #saveAndLoadHandler;
  #navbar; // eslint-disable-line no-unused-private-class-members -- for structural consistency, not used yet
  #picker;
  #overview; // eslint-disable-line no-unused-private-class-members -- for structural consistency, not used yet
  #modeSelector; // eslint-disable-line no-unused-private-class-members -- for structural consistency, not used yet
  #projectSettingManager;
  #objectManager;
  #quickSelector; // eslint-disable-line no-unused-private-class-members -- for structural consistency, not used yet
  #jobInterface; // eslint-disable-line no-unused-private-class-members -- for structural consistency, not used yet
  #inspector; // eslint-disable-line no-unused-private-class-members -- for structural consistency, not used yet
  #commandPrompt; // eslint-disable-line no-unused-private-class-members -- for structural consistency, not used yet
  #previewHandler; // eslint-disable-line no-unused-private-class-members -- for structural consistency, not used yet

  #projectId;
  #canvas;
  /**
   * @type {TransformControls}
   */
  #transformControls;
  #controls;
  #compass;
  #selectionBox;
  #directionalLight;
  #hemisphereLight;
  #skybox;
  #skyboxLoader;
  #renderer;
  #camera;
  #scene;
  #selectableGroup = new THREE.Group();
  #terrain;
  #heliostatList = [];
  #receiverList = [];
  #lightsourceList = [];

  /**
   * Private constructor for the singleton pattern. Use Editor.getInstance() instead.
   * @param {number} projectId the id of the project
   */
  constructor(/** @type {number}*/ projectId) {
    if (Editor.#instance) {
      throw new Error("Can not create class directly, use getInstance instead");
    }
    Editor.#instance = this;

    this.#projectId = projectId;

    this.#saveAndLoadHandler = SaveAndLoadHandler.getInstance(this.#projectId);

    // initiate ThreeJs scene
    this.#setUpScene();

    // initiate needed classes
    this.#undoRedoHandler = UndoRedoHandler.getInstance();
    this.#picker = new Picker(
      this.#camera,
      this.#transformControls,
      this.#selectionBox,
      this.#selectableGroup,
    );
    this.#overview = new OverviewHandler(this.#picker);
    this.#projectSettingManager = new ProjectSettingsManager();
    this.#projectSettingManager.initialize();
    this.#objectManager = new ObjectManager(
      this.#picker,
      this.#undoRedoHandler,
    );
    this.#navbar = new Navbar(this.#objectManager);
    this.#quickSelector = new QuickSelector(this.#objectManager);
    this.#jobInterface = new JobInterface(projectId);
    this.#inspector = new Inspector(this.#picker);
    this.#commandPrompt = new CommandPrompt(this.#objectManager);
    this.#previewHandler = new PreviewHandler(this.#scene);
    this.#modeSelector = new ModeSelector(this.#picker);

    window.addEventListener("resize", () => this.onWindowResize());

    this.animate();
  }

  /**
   * Gets the current editor instance in use
   * @param {number} [projectId] the id of the project, only needed for the first instantiation
   * @returns {Editor} the saveAndLoadHandler in use
   */
  static getInstance(projectId = null) {
    if (!Editor.#instance) {
      if (!projectId) {
        throw new Error(projectIdRequiredError);
      }
      Editor.#instance = new Editor(projectId);
    }
    return Editor.#instance;
  }

  /**
   * Starts the animation loop.
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    this.render();
  }

  /**
   * Renders the scene.
   */
  render() {
    this.#selectionBox.update();
    this.#renderer.clear();
    this.#renderer.render(this.#scene, this.#camera);
    this.#compass.render(this.#renderer);
  }

  /**
   * Updates the aspect ratio of the camera.
   */
  updateAspectRatio() {
    this.#camera.aspect = this.#canvas.offsetWidth / this.#canvas.offsetHeight;
    this.#camera.updateProjectionMatrix();
  }

  /**
   * Handles the window resize event.
   */
  onWindowResize() {
    this.updateAspectRatio();
    this.#renderer.setSize(this.#canvas.offsetWidth, this.#canvas.offsetHeight);
    this.render();
  }

  /**
   * Sets up the ThreeJs scene.
   * @returns {Editor} the editor instance for chaining
   */
  #setUpScene() {
    this.#canvas = document.getElementById("canvas");

    this.#scene = new THREE.Scene();

    this.#camera = new THREE.PerspectiveCamera(
      75,
      this.#canvas.clientWidth / this.#canvas.clientHeight,
      0.1,
      2000,
    );
    this.#camera.position.set(130, 50, 0);

    this.#renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    // since we render multiple times (scene and compass), we need to clear the renderer manually
    this.#renderer.autoClear = false;

    this.#renderer.shadowMap.enabled = true;
    this.#renderer.setSize(this.#canvas.clientWidth, this.#canvas.clientHeight);
    this.#canvas.appendChild(this.#renderer.domElement);

    //set up empty scene
    this.#skyboxLoader = new THREE.CubeTextureLoader();
    this.#skybox = this.#skyboxLoader.load([
      skyboxPxPath,
      skyboxNxPath,
      skyboxPyPath,
      skyboxNyPath,
      skyboxPzPath,
      skyboxNzPath,
    ]);
    this.#scene.background = this.#skybox;
    this.#scene.fog = new THREE.Fog(0xdde0e0, 100, 2200);

    this.#hemisphereLight = new THREE.HemisphereLight();
    this.#scene.add(this.#hemisphereLight);

    this.#terrain = new Terrain(2000);
    this.#scene.add(this.#terrain);

    this.#directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    this.#directionalLight.position.set(90 * 4, 400, 200 * 4);
    this.#directionalLight.castShadow = true;
    this.#scene.add(this.#directionalLight);

    this.#directionalLight.shadow.mapSize.set(16384, 16384);
    this.#directionalLight.shadow.radius = 2;
    this.#directionalLight.shadow.blurSamples = 10;
    this.#directionalLight.shadow.camera.top = 200;
    this.#directionalLight.shadow.camera.bottom = -200;
    this.#directionalLight.shadow.camera.left = 400;
    this.#directionalLight.shadow.camera.right = -400;
    this.#directionalLight.shadow.camera.far = 2000;

    // Helpers
    this.#compass = new ViewHelper(
      this.#camera,
      this.#renderer.domElement,
      200,
      "circles",
    );

    this.#selectionBox = new THREE.BoxHelper();
    this.#scene.add(this.#selectionBox);

    // controls
    this.#transformControls = new TransformControls(
      this.#camera,
      this.#renderer.domElement,
    );
    this.#transformControls.setColors(
      new THREE.Color("#ff7f9a"),
      new THREE.Color("#c2ee00"),
      new THREE.Color("#73c5ff"),
      new THREE.Color("#FFFF00"),
    );
    this.#scene.add(this.#transformControls.getHelper());

    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
    this.#controls.screenSpacePanning = false;
    this.#controls.maxDistance = 500;
    this.#controls.minDistance = 10;
    this.#controls.maxPolarAngle = Math.PI / 2 - 0.02;

    this.#controls.addEventListener("change", () => {
      const pos = this.#camera.position;
      const x = pos.x;
      const z = pos.z;
      const magnitude = Math.sqrt(x * x + z * z);

      if (magnitude > 900) {
        const normalizedX = x / magnitude;
        const normalizedZ = z / magnitude;
        pos.x = normalizedX * 900;
        pos.z = normalizedZ * 900;
      }
    });

    // disable orbit controls while moving object
    this.#transformControls.addEventListener("dragging-changed", (event) => {
      this.#controls.enabled = !event.value;
    });

    this.#selectableGroup.name = "selectableGroup";
    this.#scene.add(this.#selectableGroup);

    return this;
  }
  /**
   * Loads all the project data. Gets called after the editor is createCommands
   * @returns { Promise<Editor> } the editor in use
   */
  async loadProject() {
    const projectJson = await this.#saveAndLoadHandler.getProjectData();

    const heliostatList = projectJson["heliostats"];
    const receiverList = projectJson["receivers"];
    const lightsourceList = projectJson["light_sources"];
    const settingsList = projectJson["settings"];

    heliostatList.forEach((heliostat) => {
      const tmp = new Heliostat(
        heliostat.name,
        new THREE.Vector3(
          heliostat.position_x,
          heliostat.position_y,
          heliostat.position_z,
        ),
        heliostat.id,
      );
      this.#selectableGroup.add(tmp);
      this.#heliostatList.push(tmp);
    });

    receiverList.forEach((receiver) => {
      const tmp = new Receiver(
        receiver.name,
        new THREE.Vector3(
          receiver.position_x,
          receiver.position_y,
          receiver.position_z,
        ),
        new THREE.Vector3(
          receiver.normal_x,
          receiver.normal_y,
          receiver.normal_z,
        ),
        receiver.towerType,
        receiver.plane_e,
        receiver.plane_u,
        receiver.resolution_e,
        receiver.resolution_u,
        receiver.curvature_e,
        receiver.curvature_u,
        receiver.id,
      );
      this.#selectableGroup.add(tmp);
      this.#receiverList.push(tmp);
    });

    lightsourceList.forEach((lightsource) => {
      const tmp = new LightSource(
        lightsource.name,
        lightsource.number_of_rays,
        lightsource.lightsource_type,
        lightsource.distribution_type,
        lightsource.mean,
        lightsource.covariance,
        lightsource.id,
      );
      this.#selectableGroup.add(tmp);
      this.#lightsourceList.push(tmp);
    });

    // set the settings
    this.setShadows(settingsList["shadows"]).setFog(settingsList["fog"]);

    // remove the loading screen
    document.getElementById("loadingScreen").classList.add("d-none");

    return this;
  }

  /**
   * Enables or disables the shadows
   * @param {boolean} mode is the mode you want to use
   * @returns {Editor} returns the editor instance for chaining
   */
  setShadows(mode) {
    this.#renderer.shadowMap.enabled = mode;
    this.#directionalLight.castShadow = mode;
    this.#saveAndLoadHandler.updateSettings("shadows", mode);
    return this;
  }

  /**
   * Enables or disables the fog
   * @param {boolean} mode is the mode you want to use
   * @returns {Editor} returns the editor instance for chaining
   */
  setFog(mode) {
    this.#scene.fog = mode ? new THREE.Fog(0xdde0e0, 100, 2200) : null;
    this.#saveAndLoadHandler.updateSettings("fog", mode);
    return this;
  }

  /**
   * Adds the given heliostat to the scene and saves it.
   * @param {Heliostat} heliostat the heliostat you want to add.
   */
  async addHeliostat(heliostat) {
    this.#selectableGroup.add(heliostat);
    this.#heliostatList.push(heliostat);
    heliostat.apiID = (
      await this.#saveAndLoadHandler.createHeliostat(heliostat)
    )["id"];
  }

  /**
   * Adds the given receiver to the scene and saves it.
   * @param {Receiver} receiver the receiver you want to add.
   */
  async addReceiver(receiver) {
    this.#selectableGroup.add(receiver);
    this.#receiverList.push(receiver);
    receiver.apiID = (await this.#saveAndLoadHandler.createReceiver(receiver))[
      "id"
    ];
  }

  /**
   * Adds the given light source to the scene and saves it.
   * @param {LightSource} lightsource the light source you want to add.
   */
  async addLightsource(lightsource) {
    this.#selectableGroup.add(lightsource);
    this.#lightsourceList.push(lightsource);
    lightsource.apiID = (
      await this.#saveAndLoadHandler.createLightSource(lightsource)
    )["id"];
  }

  /**
   * Deletes the heliostat from the scene and from the database
   * @param {Heliostat} heliostat the heliostat you want to delete
   */
  async deleteHeliostat(heliostat) {
    this.#selectableGroup.remove(heliostat);
    this.#heliostatList.splice(this.#heliostatList.indexOf(heliostat), 1);
    this.#saveAndLoadHandler.deleteHeliostat(heliostat);
  }

  /**
   * Deletes the receiver from the scene and from the database
   * @param {Receiver} receiver the receiver you want to delete
   */
  async deleteReceiver(receiver) {
    this.#selectableGroup.remove(receiver);
    this.#receiverList.splice(this.#receiverList.indexOf(receiver), 1);
    this.#saveAndLoadHandler.deleteReceiver(receiver);
  }

  /**
   * Deletes the light source from the scene and from the database
   * @param {LightSource} lightsource the light source you want to delete
   */
  async deleteLightsource(lightsource) {
    this.#selectableGroup.remove(lightsource);
    this.#lightsourceList.splice(this.#lightsourceList.indexOf(lightsource), 1);
    this.#saveAndLoadHandler.deleteLightsource(lightsource);
  }

  /**
   * Gets all the placed objects in the scene.
   * @returns {{heliostatList: Heliostat[], receiverList: Receiver[], lightsourceList: LightSource[]}} an array containing all placed objects.
   */
  get objects() {
    return Object.freeze({
      heliostatList: this.#heliostatList,
      receiverList: this.#receiverList,
      lightsourceList: this.#lightsourceList,
    });
  }
}
