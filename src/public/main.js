const {ipcRenderer, app} = require("electron");

const workingArea = document.querySelector("#working-area");
const canvasWrapper = document.querySelector("#canvas-wrapper");
const mainCanvas = document.querySelector("#main-canvas");
const gridCanvas = document.querySelector("#grid-canvas");
const mainColorSwatch = document.querySelector("#main-color-swatch");
const history = {
    currentImage: null,
    currentStep: 0,
    steps: []
}
const steps = history.steps;
const canvases = [mainCanvas, gridCanvas];
pen = mainCanvas.getContext("2d", {willReadFrequently: true});
const gridPen = gridCanvas.getContext("2d")

const mouseEvents = {
    startX: null,
    startY: null,
    lastDrawnX: null,
    lastDrawnY: null,
    isDrawing: false,
    isPanning: false
}


// variables

let aspectRatio = {
    width: 16,
    height: 9,
}

let magnification = 1;
let cellSize;
const tools = Object.freeze({
    pen: "pen",
    erasor: "erasor"
})
let currentTool = tools.pen;
let currentColour = "#000000";


// functions

function resizeCanvases() {
    cellSize = (workingArea.getBoundingClientRect().width * 0.5) / (aspectRatio.width / magnification);
    const canvasWidth = Math.floor(cellSize * aspectRatio.width);
    const canvasHeight = Math.floor(cellSize * aspectRatio.height);
    canvasWrapper.style.width = canvasWidth + "px";
    canvasWrapper.style.height = canvasHeight + "px";
    canvases.forEach((canvas) => {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    })
    redrawImage();
}

function redrawImage() {
    pen.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    const lastImageFromHistory = steps[history.currentStep];
    pen.putImageData(lastImageFromHistory, 0, 0);
}


function drawGrid() {
    gridPen.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    const gridCellSize = Math.min(Math.floor(gridCanvas.width / 16), Math.floor(gridCanvas.height / 16));

    for (let x = 0; x < gridCanvas.width + cellSize; x += gridCellSize) {
        gridPen.moveTo(x, 0);
        gridPen.lineTo(x, gridCanvas.height);
    }
    for (let y = 0; y < gridCanvas.height + cellSize; y += gridCellSize) {
        gridPen.moveTo(0, y);
        gridPen.lineTo(gridCanvas.width, y);
    }
    gridPen.stroke();
}

function hexToRGB(colour) {
    const hex = colour.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16); 

    return {r, g, b};
}

function drawPixel(e) {

    const boundingRect = mainCanvas.getBoundingClientRect();

    const x = e.clientX - boundingRect.left;
    const y = e.clientY - boundingRect.top ;
    const xIndex = Math.floor(x / cellSize) * cellSize;
    const yIndex = Math.floor(y / cellSize) * cellSize;

    pen.fillStyle = currentColour;
    pen.fillRect(xIndex, yIndex, cellSize, cellSize);
    
    const modifiedImageData = pen.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    steps.push(modifiedImageData);

    history.currentStep += 1;
}

function clearPixel(e) {

    const boundingRect = mainCanvas.getBoundingClientRect();
    const x = e.clientX - boundingRect.left;
    const y = e.clientY - boundingRect.top ;
    const indexX = Math.floor(x / cellSize);
    const indexY = Math.floor(y / cellSize);
    const xPos = indexX * cellSize;
    const yPos = indexY * cellSize;
    pen.clearRect(xPos, yPos, cellSize, cellSize);
    
    const newHistoryPixels = JSON.parse(JSON.stringify(steps[steps.length - 1]));
    newHistoryPixels[indexY][indexX].colour = null;

    clearStepsAfterCurrentStep();
    steps.push(newHistoryPixels);
    redrawImage();

    mouseEvents.lastDrawnX = indexX;
    mouseEvents.lastDrawnY = indexY;

    history.currentStep += 1;
}

function clearStepsAfterCurrentStep() {
    if (history.currentStep <= steps.length - 1) {
        for(let i = steps.length - 1; i > history.currentStep; i--) {
            steps.pop();
        }
    }
}

function changeToolTo(toolName) {
    currentTool = tools[toolName];
}

function handleCanvasMouseEvent(e) {
    if (e.button === 0) {
        if (currentTool == tools.pen) {
            drawPixel(e);
        } else if (currentTool == tools.erasor) {
            clearPixel(e);
        }
    }
}

// Event listeners

canvasWrapper.onmousedown = (e) => {
    if (e.button === 1) {
        mouseEvents.startX = e.clientX;
        mouseEvents.startY = e.clientY;
        mouseEvents.isPanning = true;
    }
}

canvasWrapper.onmousemove = (e) => {
    if (mouseEvents.isPanning) {
        const deltaX = e.clientX - mouseEvents.startX;
        const deltaY = e.clientY - mouseEvents.startY;
        canvasWrapper.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
}

canvasWrapper.onwheel = (e) => {
    const sign = Math.sign(e.deltaY);
    if (sign == 1 && magnification <= 0.4) {
        return;
    }
    if (sign == -1 && magnification >= 2) {
        return;
    }
    magnification += sign * -0.02;
    resizeCanvases();
    drawGrid();
}

document.onmouseup = (e) => {
    if (mouseEvents.isPanning) {
        mouseEvents.startX = e.clientX;
        mouseEvents.startY = e.clientY;
        mouseEvents.isPanning = false;
    }
}

mainCanvas.onmousedown = (e) => {
    mouseEvents.isDrawing = true;
    handleCanvasMouseEvent(e);
}

mainCanvas.onmousemove = (e) => {
    if (!mouseEvents.isDrawing) return;
    const boundingRect = mainCanvas.getBoundingClientRect();
    const x = e.clientX - boundingRect.left;
    const y = e.clientY - boundingRect.top ;
    const indexX = Math.floor(x / cellSize);
    const indexY = Math.floor(y / cellSize);

    if (mouseEvents.lastDrawnX !== indexX && mouseEvents.lastDrawnY !== indexY) {
        handleCanvasMouseEvent(e);
    }
}

mainCanvas.onmouseup = (e) => {
    mouseEvents.isDrawing = false;
}

mainColorSwatch.onchange = (e) => {
    currentColour = e.target.value;
}

// IpcRenderer events

ipcRenderer.on("save-image", (event) => {
    const canvasData = mainCanvas.toDataURL().replace(/^data:image\/png;base64,/, '');
    ipcRenderer.send("save-image", canvasData);
})

ipcRenderer.on("open-image", (event, imageDataUrl) => {
    const img = new Image();
    img.onload = () => {
        const imageWidth = img.naturalWidth;
        const imageHeight = img.naturalHeight;
        aspectRatio.width = imageWidth;
        aspectRatio.height = imageHeight;
        createCanvasHistory();
        resizeCanvases();

    
        pen.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height);
    }
    img.src = imageDataUrl;
    history.currentImage = img;
})

ipcRenderer.on("undo", () => {
    if (history.currentStep > 0){ 
        history.currentStep -= 1;
        redrawImage();
    }
})

ipcRenderer.on("redo", () => {
    if (history.currentStep < steps.length - 1) {
        history.currentStep += 1;
        redrawImage();
    }
})

// Initialization

function createCanvasHistory() {
    history.currentStep = 0;
    steps.length = 0;
    const initialImageData = mainCanvas.getContext("2d").getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    steps.push(initialImageData);
}

window.onload = () => {
    canvasWrapper.width = workingArea.getBoundingClientRect().width / 2;
    canvasWrapper.height = workingArea.getBoundingClientRect().height / 2;
    createCanvasHistory();
    resizeCanvases();
    drawGrid();
}
