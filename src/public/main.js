const canvasWrapper = document.querySelector("#canvas-wrapper");
const mainCanvas = document.querySelector("#canvas");
const gridDisplay = document.querySelector("#grid-display");

const pen = mainCanvas.getContext("2d");
const gridPen = gridDisplay.getContext("2d");

const canvases = [mainCanvas, gridDisplay];
const cellSize = canvasWrapper.clientWidth / 32;

canvases.forEach((canvas) => {
    canvas.width = canvasWrapper.clientWidth;
    canvas.height = canvasWrapper.clientHeight;
})

function drawGrid() {
    gridPen.clearRect(0, 0, gridDisplay.width, gridDisplay.height);
    for (let x = 0; x < gridDisplay.width; x += cellSize) {
        gridPen.moveTo(x, 0);
        gridPen.lineTo(x, gridDisplay.height);
    }
    for (let y = 0; y < gridDisplay.height; y += cellSize) {
        gridPen.moveTo(0, y);
        gridPen.lineTo(gridDisplay.width, y);
    }
    gridPen.stroke();
}

drawGrid();

mainCanvas.onclick = (e) => {
    const Rect = mainCanvas.getBoundingClientRect();
    const x = e.clientX - Rect.left;
    const y = e.clientY - Rect.top;
    drawPixel(x, y);
}

function drawPixel(x, y) {
    const xPos = Math.floor(x / cellSize)// * cellSize;
    const yPos = Math.floor(y / cellSize)// * cellSize;
    pen.fillRect(xPos, yPos, cellSize, cellSize);
}