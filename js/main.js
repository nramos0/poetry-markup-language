
window.onload = loadMainPage;
const path = require('path');
const url = require('url');
const remote = require('electron').remote;

function loadMainPage() {
    loadButtonListeners();
}

function loadButtonListeners() {
    var editorButton = document.getElementById('editorButton');
    var viewerButton = document.getElementById('viewerButton');

    function callback() {
        remote.getCurrentWindow().show();
    }

    editorButton.addEventListener('click', function(err) {
        createWindow(800, 600, 'editor.html', callback);
        remote.getCurrentWindow().hide();
    });

    viewerButton.addEventListener('click', function(err) {
        createWindow(800, 600, 'viewer.html', undefined, false);
        remote.getCurrentWindow().hide();
    });
}

function createWindow(widthInput, heightInput, htmlFilename, onClosedCallback, isVisible) {
    // Constructs window
    let win;
    var options = {
        width: widthInput, 
        height: heightInput,
        show: isVisible,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    };
    try {
        win = new BrowserWindow(options);
    } 
    catch (err) {
        // If there is an error in creating a BrowserWindow, it is probably because 
        // a BrowserWindow is being created from a renderer process, which is not
        // allowed unless it uses Electron's remote
        BrowserWindow = remote.BrowserWindow;
        win = new BrowserWindow(options);
    }

    if (isVisible != false) {
        win.once('ready-to-show', function() {
            win.show();
        });
    }
    
    // Loads initial html file
    var htmlFilePath = path.join(__dirname, '../src/' + htmlFilename);

    win.loadURL(url.format({
      pathname: htmlFilePath,
      protocol: 'file:',
      slashes: true
    }))

    win.on('closed', function() {
        remote.getCurrentWindow().show();
        win = null;
        
    });
  
    // Prevents the calling of 'eval()' which allows any arbitrary
    // JS code to be evaluted. This is for security purposes.
    win.eval = global.eval = function () {
      throw new Error('Sorry, this app does not support window.eval().')
    }
  
    // Opens the Chrome page inspector when the window opens for easy debugging

    // win.webContents.openDevTools();
  
    // Emitted when the window is closed.
    win.on('closed', () => {
        if (onClosedCallback !== undefined) {
            onClosedCallback(win);
        }
        win = null;
    }); 
    return win;   
}