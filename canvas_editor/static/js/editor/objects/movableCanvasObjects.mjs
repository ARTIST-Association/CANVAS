import { CanvasObject } from "canvasObject";
import { UndoRedoHandler } from "undoRedoHandler";

export class movableCanvasObject extends CanvasObject {
    constructor(movableObjectName, undoRedoHandler) {
        super(movableObjectName, undoRedoHandler, null, true, true);
    }
}