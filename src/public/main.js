/**
 * @author 0m0g1
 * @github https://0m0g1.github.io
 */

const {ipcRenderer, app} = require("electron");

const createNewImageButton = document.querySelector("#create-new-image-button");
const workingArea = document.querySelector("#working-area");
const canvasWrapper = document.querySelector("#canvas-wrapper");
const mainCanvas = document.querySelector("#main-canvas");
const gridCanvas = document.querySelector("#grid-canvas");
const mainColorSwatch = document.querySelector("#main-color-swatch");
const titleBars = document.querySelectorAll(".title-bar");
const closePopupButtons = document.querySelectorAll(".close-popup");
const pixelInputs = document.querySelectorAll(".pixel-input");
const history = {
    currentImage: null,
    currentStep: 0,
    steps: []
}
const steps = history.steps;
const canvases = [mainCanvas, gridCanvas];
pen = mainCanvas.getContext("2d", {willReadFrequently: true});
const gridPen = gridCanvas.getContext("2d");

const imageConfigs = {
    isNewImage: false,
    bgColor: "white",
    height: 9,
    width: 16,
}

const mouseEvents = {
    startX: null,
    startY: null,
    lastDrawnX: null,
    lastDrawnY: null,
    isDrawing: false,
    isPanning: false
}


// variables

let magnification = 1;
let cellSize;
const tools = Object.freeze({
    pen: "pen",
    erasor: "erasor"
})
let currentTool = tools.pen;
let currentColour = "#000000";
let showGrid = false;


// functions

function resizeCanvases() {
    cellSize = (workingArea.getBoundingClientRect().width * 0.5) / (imageConfigs.width / magnification);
    const canvasWidth = Math.floor(cellSize * imageConfigs.width);
    const canvasHeight = Math.floor(cellSize * imageConfigs.height);
    canvasWrapper.style.width = canvasWidth + "px";
    canvasWrapper.style.height = canvasHeight + "px";
    canvases.forEach((canvas) => {
        canvas.style.width = canvasWrapper.style.width;
        canvas.style.height = canvasWrapper.style.height;
    })
    redrawImage();
}

function redrawImage() {
    const imageOnThisStep = steps[history.currentStep];
    if (imageConfigs.isNewImage) {
        pen.fillStyle = imageConfigs.bgColor;
        pen.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    } else {
        pen.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    }
    
    if (!imageOnThisStep) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageOnThisStep.width;
    tempCanvas.height = imageOnThisStep.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageOnThisStep, 0, 0);


    pen.save();
    pen.scale(mainCanvas.width / imageOnThisStep.width, mainCanvas.height / imageOnThisStep.height);
    pen.drawImage(tempCanvas, 0, 0);
    pen.restore();
}


function drawGrid() {
    gridPen.clearRect(0, 0, gridCanvas.style.width, gridCanvas.style.height);
    if (!showGrid) return;

    for (let x = 0; x < gridCanvas.width + cellSize; x += cellSize) {
        gridPen.moveTo(x, 0);
        gridPen.lineTo(x, gridCanvas.height);
    }
    for (let y = 0; y < gridCanvas.height + cellSize; y += cellSize) {
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
    
    clearStepsAfterCurrentStep();
    
    steps.push(modifiedImageData);
    
    mouseEvents.lastDrawnX = xIndex;
    mouseEvents.lastDrawnY = yIndex;
    
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

    if (imageConfigs.isNewImage) {
        pen.fillStyle = imageConfigs.bgColor;
        pen.fillRect(xPos, yPos, cellSize, cellSize);
    } else {
        pen.clearRect(xPos, yPos, cellSize, cellSize);
    }
    
    const modifiedImageData = pen.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    
    clearStepsAfterCurrentStep();
    
    // mouseEvents.lastDrawnX = indexX;
    // mouseEvents.lastDrawnY = indexY;
    
    steps.push(modifiedImageData);
    history.currentStep += 1;

    redrawImage();
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

function resizeInputToWidthOfTextInside(input) {
    const tempSpan = document.createElement("span");
    tempSpan.innerHTML = input.value;
    tempSpan.style.visibility = "hidden";
    document.body.appendChild(tempSpan);
    input.style.width = tempSpan.offsetWidth + "px";
    document.body.removeChild(tempSpan);
}

function createNewImage() {
    const newImageWidthInput = document.querySelector("#new-image-width-input");
    const newImageHeightInput = document.querySelector("#new-image-height-input");
    const bgSelectors = document.querySelectorAll(".bg-selector");
    bgSelectors.forEach((selector) => {
        if (selector.checked) {
            imageConfigs.bgColor = selector.value;
        }
    })
    imageConfigs.isNewImage = true;

    imageConfigs.width = parseInt(newImageWidthInput.value);
    imageConfigs.height = parseInt(newImageHeightInput.value);

    mainCanvas.width = imageConfigs.width;
    mainCanvas.height = imageConfigs.height;

    createCanvasHistory();
    resizeCanvases();
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
    if (e.button == 0) {
        mouseEvents.isDrawing = true;

        const boundingRect = mainCanvas.getBoundingClientRect();
        const x = e.clientX - boundingRect.left;
        const y = e.clientY - boundingRect.top ;
        const indexX = Math.floor(x / cellSize);
        const indexY = Math.floor(y / cellSize);
        
        if (mouseEvents.lastDrawnX !== indexX && mouseEvents.lastDrawnY !== indexY) {
            handleCanvasMouseEvent(e);
        }
    }
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

mainCanvas.onmouseup = () => {
    mouseEvents.isDrawing = false;
}

mainCanvas.onmouseleave = () => {
    mouseEvents.isDrawing = false;
}

mainColorSwatch.onchange = (e) => {
    currentColour = e.target.value;
}

let popupMovement = {
    startX: null,
    startY: null,
    isMovingPopup: false,
}

titleBars.forEach((bar) => {
    bar.dataset.deltaX = 0;
    bar.dataset.deltaY = 0;

    bar.onmousedown = (e) => {
        popupMovement.startX = e.clientX - parseInt(bar.dataset.deltaX);
        popupMovement.startY = e.clientY - parseInt(bar.dataset.deltaY);
        popupMovement.isMovingPopup = true;
    }
    bar.onmousemove = (e) => {
        if (popupMovement.isMovingPopup == false) return;
        
        const deltaX = e.clientX - popupMovement.startX;
        const deltaY =  e.clientY - popupMovement.startY;
        const popup = document.querySelector(`#${bar.dataset.parent}`);
        popup.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        bar.dataset.deltaX = deltaX;
        bar.dataset.deltaY = deltaY;
    }
    bar.onmouseup = (e) => {
        popupMovement.isMovingPopup = false;
    }
    bar.onmouseleave = (e) => {
        popupMovement.isMovingPopup = false;
    }
})

closePopupButtons.forEach((button) => {
    button.onclick = () => {
        const parentPopup = document.querySelector(`#${button.dataset.parent}`);
        parentPopup.style.display = "none";
        parentPopup.style.transform = "";
    }
})

pixelInputs.forEach((input) => {
    input.onready = () => {
        const inputValue = input.value;
        input.value = inputValue.replace(/[^0-9]/g, "");
        if (parseInt(input.value) <= 0) {
            input.value = "1";
        }
        if (parseInt(input.value) >= 2048) {
            input.value = "2048";
        }
        resizeInputToWidthOfTextInside(input);
    }
    input.oninput = () => {
        const inputValue = input.value;
        input.value = inputValue.replace(/[^0-9]/g, "");
        if (parseInt(input.value) <= 0) {
            input.value = "1";
        }
        if (parseInt(input.value) >= 2048) {
            input.value = "2048";
        }
        resizeInputToWidthOfTextInside(input);
    }
})

createNewImageButton.onclick = () => {
    const popup = document.querySelector(`#${createNewImageButton.dataset.parent}`);
    popup.style.display = "none";
    createNewImage();
}

// IpcRenderer events

ipcRenderer.on("save-image", (event) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = imageConfigs.width;
    tempCanvas.height = imageConfigs.height;
    const tempPen = tempCanvas.getContext("2d");
    tempPen.drawImage(mainCanvas, 0, 0, imageConfigs.width, imageConfigs.height);
    const canvasData = tempCanvas.toDataURL().replace(/^data:image\/png;base64,/, '');
    ipcRenderer.send("save-image", canvasData);
})

ipcRenderer.on("open-image", (event, imageDataUrl) => {
    const img = new Image();
    img.onload = () => {
        const imageWidth = img.naturalWidth;
        const imageHeight = img.naturalHeight;
        imageConfigs.isNewImage = false; 
        imageConfigs.width = imageWidth;
        imageConfigs.height = imageHeight;

        mainCanvas.width = imageConfigs.width;
        mainCanvas.height = imageConfigs.height;

        createCanvasHistory();
        resizeCanvases();

        steps.push(pen.getImageData(0, 0, mainCanvas.width, mainCanvas.height));
        history.currentStep += 1;

        pen.drawImage(img, 0, 0);
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

ipcRenderer.on("new-image", () => {
    document.getElementById("new-image-popup").style.display = "flex";
})

ipcRenderer.on("toggle-show-grid", (event, state) => {
    showGrid = state;
    drawGrid();
})

// Initialization

function createCanvasHistory() {
    history.currentStep = 0;
    steps.length = 0;
    const initialImageData = mainCanvas.getContext("2d").getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    steps.push(initialImageData);
}

window.onload = () => {
    pen.imageSmoothingEnabled = false;
    canvasWrapper.width = workingArea.getBoundingClientRect().width / 2;
    canvasWrapper.height = workingArea.getBoundingClientRect().height / 2;
    pixelInputs.forEach((input) => {
        resizeInputToWidthOfTextInside(input);
    })
    createCanvasHistory();
    resizeCanvases();
    drawGrid();
}
