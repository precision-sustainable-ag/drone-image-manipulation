import { Control } from "ol/control";
import ReactDOMServer from "react-dom/server"
import PolylineOutlinedIcon from '@mui/icons-material/PolylineOutlined';

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

    const drawButton = document.createElement("button");
    drawButton.className = "draw-buttons";
    const iconString = ReactDOMServer.renderToString(<PolylineOutlinedIcon />);
    drawButton.innerHTML = `Draw${iconString}`;

    const clearButton = document.createElement("button");
    clearButton.className = "draw-buttons";
    clearButton.innerHTML = "Clear";

    const element = document.createElement("div");
    element.className = "draw-buttons-div";
    element.appendChild(drawButton);
    element.appendChild(clearButton);

    super({
      element: element,
      target: options.target,
    });

    this.vectorSource = options["vector_source"];
    this.clearData = options["clearData"]; // function to clear any data that is set when a grid is drawn
    this.drawInteraction = null;
    this.isDrawing = false;
    this.drawButton = drawButton;

    drawButton.addEventListener("click", this.handleToggleDraw.bind(this), false);
    clearButton.addEventListener("click", this.handleClearGrid.bind(this), false);
  }

  drawCleanup() {
    const map = this.getMap();
    if (this.drawInteraction && map) {
      map.removeInteraction(this.drawInteraction);
      this.drawInteraction = null;
      this.isDrawing = false;
      this.drawButton.classList.remove("active");
    }
  }

  handleToggleDraw() {
    const map = this.getMap();
    if (map) {
      // If user is not drawing, start drawing
      if (!this.isDrawing) {
        this.drawInteraction = window.drawHandler(this.vectorSource, map);
        this.isDrawing = true;
        this.drawButton.classList.add("active");
        // When drawing ends
        this.drawInteraction.on("drawend", () => {
          this.drawCleanup();
        });
      } else {
        // When user cancels drawing before it is finished
        this.drawCleanup();
      }
    }
  }

  handleClearGrid() {
    if (this.vectorSource) {
      this.vectorSource.clear();
    } if (this.clearData) {
      this.clearData();
    }
  }
}
