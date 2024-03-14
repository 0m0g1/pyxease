const {ipcRenderer} = require("electron");

const workingArea = document.querySelector("#working-area");
const canvasWrapper = document.querySelector("#canvas-wrapper");
const mainCanvas = document.querySelector("#main-canvas");
const gridCanvas = document.querySelector("#grid-canvas");
const history = [];

const canvases = [mainCanvas, gridCanvas];

canvasWrapper.width = workingArea.getBoundingClientRect().width / 2;
canvasWrapper.height = workingArea.getBoundingClientRect().height / 2;

let aspectRatio = {
    x: 16,
    y: 9
}

let magnification = 1;
let cellSize;
const mouseEvents = {
    startX: null,
    startY: null,
    isPanning: false
}

function resizeCanvases() {
    cellSize = (workingArea.getBoundingClientRect().width / 2) / (aspectRatio.x / magnification);
    const canvasWidth = Math.floor(cellSize * aspectRatio.x);
    const canvasHeight = Math.floor(cellSize * aspectRatio.y);
    canvasWrapper.style.width = canvasWidth + "px";
    canvasWrapper.style.height = canvasHeight + "px";
    canvases.forEach((canvas) => {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    })
    redrawImage();
}

function redrawImage() {
    const lastImageFromHistory = history[history.length - 1];
    const pen = mainCanvas.getContext("2d");
    pen.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    lastImageFromHistory.forEach((pixel) => {
        console.log(pixel);
        const xPox = pixel.x * cellSize;
        const yPos = pixel.y * cellSize;
        pen.fillStyle = pixel.colour;
        pen.fillRect(xPox, yPos, cellSize, cellSize);
    })
}


function drawGrid() {
    const pen = gridCanvas.getContext("2d");
    pen.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    for (let x = 0; x < gridCanvas.width + cellSize; x += cellSize) {
        pen.moveTo(x, 0);
        pen.lineTo(x, gridCanvas.height);
    }
    for (let y = 0; y < gridCanvas.height + cellSize; y += cellSize) {
        pen.moveTo(0, y);
        pen.lineTo(gridCanvas.width, y);
    }
    pen.stroke();
}

function drawPixel(e) {
    const pen = mainCanvas.getContext("2d");
    const boundingRect = mainCanvas.getBoundingClientRect();
    const x = e.clientX - boundingRect.left;
    const y = e.clientY - boundingRect.top ;
    const indexX = Math.floor(x / cellSize);
    const indexY = Math.floor(y / cellSize);
    const xPos = indexX * cellSize;
    const yPos = indexY * cellSize;
    pen.fillRect(xPos, yPos, cellSize, cellSize);
    
    const newHistoryPixels = [...history[history.length - 1]];
    newHistoryPixels.push({x: indexX, y: indexY, colour: "#000000"});
    history.push(newHistoryPixels);
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
    console.log(magnification)
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
    if (e.button === 0) {
        drawPixel(e);
    }
}

ipcRenderer.on("save-image", (event) => {
    const canvasData = mainCanvas.toDataURL().replace(/^data:image\/png;base64,/, '');
    ipcRenderer.send("save-image", canvasData);
})

window.onload = () => {
    history.push([]);
    resizeCanvases();
    drawGrid();
}
