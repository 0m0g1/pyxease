const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const fs = require("fs");
const path = require('path');

const pathToViews = path.join(__dirname, "views");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(pathToViews, 'index.html'));
  Menu.setApplicationMenu(createMainMenu());

  mainWindow.maximize();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};


function createMainMenu() {
    const template = [
      {
          label: 'File',
          submenu: [
              {
                  label: 'New',
                  accelerator: 'CmdOrCtrl+N',
                  click() {
                      mainWindow.webContents.send("new-image");
                  }
              },
              {
                  label: 'Open',
                  accelerator: 'CmdOrCtrl+O',
                  click() {
                      openImage();
                  }
              },
              {
                  label: 'Save',
                  accelerator: 'CmdOrCtrl+S',
                  click() {
                      mainWindow.webContents.send("save-image");
                  }
              },
              { type: 'separator' },
              {
                  label: 'Exit',
                  role: 'quit'
              }
          ]
      },
      {
          label: 'Edit',
          submenu: [
              {
                  label: 'Undo',
                  accelerator: "CmdorCtrl+z",
                  click: () => {
                    mainWindow.webContents.send("undo");
                  }
              },
              {
                  label: 'Redo',
                  accelerator: "CmdorCtrl+Y",
                  click: () => {
                    mainWindow.webContents.send("redo");
                  }
              },
              { type: 'separator' },
              {
                  label: 'Cut',
                  role: 'cut'
              },
              {
                  label: 'Copy',
                  role: 'copy'
              },
              {
                  label: 'Paste',
                  role: 'paste'
              }
          ]
      },
      {
          label: 'View',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' },
            {
                label: "Grid",
                type: "checkbox",
                checked: false,
                click: (button) => {
                    mainWindow.webContents.send("toggle-show-grid", button.checked);   
                }
            }
        ]
      },
      {
          label: 'Help',
          submenu: [
              {
                  label: 'About',
                  click() {
                      // Handle 'About' action
                  }
              }
          ]
      }
  ];
  const menu = Menu.buildFromTemplate(template);
  return menu;
}

ipcMain.on("save-image", (event, data) => {
  saveCanvasImage(data);
})

function openImage() {
    dialog.showOpenDialog({
        title: "choose an image",
        filters: [
            {name: "png image", extensions: ["png"]}
        ]
    }).then((result) => {
        if (!result.canceled) {
            const filePath = result.filePaths[0];
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    throw(err);
                }
                else {
                    const imageDataUrl = `data:image/png;base64,${data.toString("base64")}`;
                    mainWindow.webContents.send("open-image", imageDataUrl);
                }
            })
        }
    }).catch((err) => {
        dialog.showErrorBox("Error opening file",  `There was an error oppening the file: ${err}`);
    })
}


function saveCanvasImage(canvasData) {
  // Create a dialog to choose save location
  dialog.showSaveDialog(mainWindow, {
      title: 'Save Image',
      defaultPath: path.join(app.getPath('pictures'), 'canvas_image.png'),
      filters: [{ name: 'Images', extensions: ['png'] }]
  }).then(result => {
      if (!result.canceled && result.filePath) {
          // Write canvas data to file
          fs.writeFile(result.filePath, canvasData, 'base64', (err) => {
              if (err) {
                  console.error('Error saving file:', err);
              } else {
                  console.log('File saved successfully!');
              }
          });
      }
  }).catch(err => {
      console.error('Error saving file:', err);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
