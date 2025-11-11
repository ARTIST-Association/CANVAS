import { CanvasObject } from "canvasObject";

export class movableCanvasObject extends CanvasObject {
    constructor(movableObjectName, undoRedoHandler) {
        super(movableObjectName, undoRedoHandler, null, true, true);
    }
}