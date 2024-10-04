import { Control } from "ol/control";

const leftRotate = require("../assets/images/rotate-left.png");
const rightRotate = require("../assets/images/rotate-right.png");

export class RotateMap extends Control {
  constructor(options) {
    const direction = options["direction"];

    const button = document.createElement("button");
    button.className = "rotate-button";
    const img = document.createElement("img");
    img.src = direction === "left" ? leftRotate : rightRotate;
    img.className = "rotate-img";
    button.appendChild(img);
    button.title =
      direction === "left"
        ? "Rotate left\nShift+Drag"
        : "Rotate right\nShift+Drag";

    const element = document.createElement("div");
    element.className =
      direction === "left"
        ? "rotate-div left-rotate-div button-hover"
        : "rotate-div right-rotate-div button-hover";
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    this.direction = direction;
    button.addEventListener("click", this.handleRotate.bind(this), false);
  }
  handleRotate() {
    const view = this.getMap().getView();
    const rotation = view.getRotation();
    view.animate({
      rotation:
        this.direction === "left"
          ? rotation - Math.PI / 20
          : rotation + Math.PI / 20,
      duration: 250,
    });
  }
}

export class ToggleDraw extends Control {
  constructor(opt_options) {
    const options = opt_options || {};
    const button = document.createElement("button");
    button.className = "toggle-button";
    button.innerHTML = "Draw";

    const element = document.createElement("div");
    element.className = "toggle-draw";
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    this.vectorSource = options["vector_source"];

    button.addEventListener("click", this.handleToggleDraw.bind(this), false);
  }
  handleToggleDraw() {
    const map = this.getMap();
    if (map) {
      window.drawGrid(this.vectorSource, map);
    }
  }
}
