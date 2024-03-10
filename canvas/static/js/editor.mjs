import * as THREE from "three";

import { Menu } from "menu";

let editorInstance = null;

export class Editor {
    constructor() {
        // singleton
        if (editorInstance) return editorInstance;
        editorInstance = this;

        this.menu = new Menu();
        this.canvas = document.getElementById("canvas");

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.canvas.appendChild(this.renderer.domElement);

        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        this.cube = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.cube);

        this.camera.position.y = -2;
        this.camera.position.x = 3;
        this.camera.position.z = 10;

        requestAnimationFrame(() => {
            this.renderer.render(this.scene, this.camera);
        });
    }
}