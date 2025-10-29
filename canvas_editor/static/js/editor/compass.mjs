/**
 * Adapted from three@0.163.0/examples/jsm/helpers/ViewHelper.js, Copyright 2010-2024 Three.js Authors, MIT License
 */

import { invalidCompassStyleError } from "message_dict";
import {
  ArrowHelper,
  BoxGeometry,
  Camera,
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  Sprite,
  SpriteMaterial,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";

/**
 * Class representing an axis arrow for the compass.
 */
class CompassAxisArrow extends Object3D {
  /**
   * Creates an instance of the compass axis arrow.
   * @param {string} axisId - The ID of the axis (x, y, or z).
   * @param {Color} color - The color of the arrow.
   * @param {string} label - The label for the arrow.
   */
  constructor(axisId, color, label) {
    super();
    this.axisId = axisId;

    this.direction = new Vector3(1, 0, 0);
    if (this.axisId == "y") {
      this.direction = new Vector3(0, 1, 0);
    } else if (this.axisId == "z") {
      this.direction = new Vector3(0, 0, 1);
    }

    this.arrow = new ArrowHelper(
      this.direction,
      new Vector3(0, 0, 0),
      1,
      color,
      0.3,
      0.3,
    );
    this.add(this.arrow);

    this.label = this.getTextSprite(color, label);
    this.label.position[this.axisId] = 1.25;
    this.add(this.label);
  }

  /**
   * Disposes of the arrow and label resources.
   */
  dispose() {
    this.arrow.dispose();
    this.label.material.map.dispose();
    this.label.material.dispose();
  }

  /**
   * Creates a text sprite for the compass label.
   * @param {Color} color - The color of the text.
   * @param {string} text - The text to display.
   * @returns {Sprite} - The created text sprite.
   */
  getTextSprite(color, text) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;

    const context = canvas.getContext("2d");
    context.font = "24px Arial";
    context.textAlign = "center";
    context.fillStyle = color.getStyle();
    context.fillText(text, 32, 41);

    const texture = new CanvasTexture(canvas);
    const material = new SpriteMaterial({
      map: texture,
      toneMapped: false,
    });
    return new Sprite(material);
  }
}

/**
 * Compass axis with a circle at the end instead of the arrow head
 */
class CompassAxisCircle extends Object3D {
  /**
   * Create a new compass axis with a circle at the end
   * @param {"x" | "y" | "z"} axisId the id of the axis
   * @param {Color} color the color of the axis
   * @param {string} label the label of the axis
   * @param {number} axisWidth the width of the axis
   */
  constructor(axisId, color, label, axisWidth = 0.05) {
    super();
    this.axisId = axisId;

    // the axis is a box of width 0.8 (and height/depth 0.05), starting at (0,0,0)
    const axisGeometry = new BoxGeometry(0.8, axisWidth, axisWidth).translate(
      0.4,
      0,
      0,
    );
    this.axis = new Mesh(axisGeometry, this.getAxisMaterial(color));

    if (this.axisId == "y") {
      this.axis.rotation.z = Math.PI / 2;
    } else if (this.axisId == "z") {
      this.axis.rotation.y = -Math.PI / 2;
    }

    this.add(this.axis);

    this.posAxisHelper = new Sprite(this.getSpriteMaterial(color, label));
    this.posAxisHelper.userData.type = "pos" + label;

    this.negAxisHelper = new Sprite(this.getSpriteMaterial(color));
    this.negAxisHelper.userData.type = "neg" + label;

    this.posAxisHelper.position[this.axisId] = 1;
    this.negAxisHelper.position[this.axisId] = -1;
    this.negAxisHelper.scale.setScalar(0.8);

    this.add(this.posAxisHelper);
    this.add(this.negAxisHelper);
  }

  /**
   * Disposes the compass
   */
  dispose() {
    this.axis.material.dispose();

    this.posAxisHelper.material.map.dispose();
    this.negAxisHelper.material.map.dispose();

    this.posAxisHelper.material.dispose();
    this.negAxisHelper.material.dispose();
  }

  /**
   * Set the opacity of the end of an axis
   * Depending if the positive or negative part is present
   * @param {Vector3} point the current point of the axis
   */
  setOpacity(point) {
    // set opacity so the "hidden" part of the axis is partially transparent
    if (point[this.axisId] >= 0) {
      this.posAxisHelper.material.opacity = 1;
      this.negAxisHelper.material.opacity = 0.5;
    } else {
      this.posAxisHelper.material.opacity = 0.5;
      this.negAxisHelper.material.opacity = 1;
    }
  }

  /**
   * Update the point of of an axis
   * @param {Vector3} point the current point for the given axis
   */
  update(point) {
    this.setOpacity(point);
  }

  /**
   * Get the material for the axis based on the color
   * @param {import("three").ColorRepresentation} color the color of the axis
   * @returns {MeshBasicMaterial} the material for the axis
   */
  getAxisMaterial(color) {
    return new MeshBasicMaterial({ color: color, toneMapped: false });
  }

  /**
   * Create sprite material based on the given color and text
   * @param {Color} color the color of the sprite
   * @param {string} text the text for the sprite
   * @returns {SpriteMaterial} the material for the sprite
   */
  getSpriteMaterial(color, text = null) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;

    const context = canvas.getContext("2d");
    context.beginPath();
    context.arc(32, 32, 16, 0, 2 * Math.PI);
    context.closePath();
    context.fillStyle = color.getStyle();
    context.fill();

    if (text !== null) {
      context.font = "24px Arial";
      context.textAlign = "center";
      context.fillStyle = "#000000";
      context.fillText(text, 32, 41);
    }

    const texture = new CanvasTexture(canvas);

    return new SpriteMaterial({ map: texture, toneMapped: false });
  }
}

/**
 * Represents an view helper inside the canvas
 */
class ViewHelper extends Object3D {
  /**
   * Create a new view helper
   * @param {Camera} camera the camera in use
   * @param {HTMLElement} domElement the element where the canvas is rendered
   * @param {number} size the size of the view helper
   * @param {"arrows" | "circles"} style the style
   */
  constructor(camera, domElement, size = 128, style = "arrows") {
    super();
    this.camera = camera;
    this.domElement = domElement;
    this.style = style;

    this.orthoCamera = new OrthographicCamera(-2, 2, 2, -2, 0, 4);
    this.orthoCamera.position.set(0, 0, 2);

    this.geometry = new BoxGeometry(0.8, 0.05, 0.05).translate(0.4, 0, 0);

    if (style == "circles") {
      this.xAxis = new CompassAxisCircle("x", new Color("#ff3653"), "N");
      this.yAxis = new CompassAxisCircle("y", new Color("#8adb00"), "U");
      this.zAxis = new CompassAxisCircle("z", new Color("#2c8fff"), "E");
    } else if (style == "arrows") {
      this.xAxis = new CompassAxisArrow("x", new Color("#ff3653"), "N");
      this.yAxis = new CompassAxisArrow("y", new Color("#8adb00"), "U");
      this.zAxis = new CompassAxisArrow("z", new Color("#2c8fff"), "E");
    } else {
      throw new Error(invalidCompassStyleError + style);
    }
    for (const axis of [this.xAxis, this.yAxis, this.zAxis]) {
      this.add(axis);
    }

    this.point = new Vector3();
    this.dim = size;
  }

  /**
   * Render function, gets called every frame
   * @param {WebGLRenderer} renderer the renderer in use
   */
  render(renderer) {
    this.quaternion.copy(this.camera.quaternion).invert();
    this.updateMatrixWorld();

    this.point.set(0, 0, 1);
    this.point.applyQuaternion(this.camera.quaternion);

    if (this.style == "circles") {
      //@ts-expect-error
      this.xAxis.update(this.point);
      //@ts-expect-error
      this.yAxis.update(this.point);
      //@ts-expect-error
      this.zAxis.update(this.point);
    }

    let previousViewport = new Vector4();
    renderer.getViewport(previousViewport); // save current viewport to reset later

    // change viewport to dim x dim square in lower right corner
    const x = this.domElement.offsetWidth - this.dim; // upper left corner of the viewport
    const y = this.domElement.offsetHeight - this.dim;
    renderer.setViewport(x, y, this.dim, this.dim);

    renderer.clearDepth();
    renderer.render(this, this.orthoCamera);

    renderer.setViewport(previousViewport); // reset to previous viewport
  }

  /**
   * Dispose the view helper
   */
  dispose() {
    this.geometry.dispose();

    this.xAxis.dispose();
    this.yAxis.dispose();
    this.zAxis.dispose();
  }
}

export { ViewHelper };
