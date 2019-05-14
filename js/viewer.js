const remote = require('electron').remote;
const { dialog } = require('electron').remote;
const fs = require('fs');

/**
 * Prompts the user for a PML file to load and then passes it to the parser
 */
window.onload = async function() {
    var fileToLoadList = dialog.showOpenDialog(
        {
            properties: ['openFile'],
            filters: [
                {
                    name: 'PML File',
                    extensions: ['pml']
                }
            ]
        }
    );
    var fileToLoad = fileToLoadList[0];

    loadFile(fileToLoad);    
}

/**
 * Attempts to get the data from the given PML file at path filename
 * Sends the data to be loaded into the viewer if successful,
 * closes the window otherwise
 * @param {String} filename The name of the file to load in
 */
function loadFile(filename) {
    var fileDataPromise = getFileData(filename);

    fileDataPromise.then(function(fileData) {
        loadFileDataToViewer(fileData);
    }, function(err) {
        alert('That file couldn\'t be loaded: ' + err.message);
        remote.getCurrentWindow().close();
    });
}

/**
 * Attemps to read in the data from the given filename
 * Returns a Promise ensuring some resolution about the data
 * @param {String} filename The file to get data from
 * @returns {Promise} A promise ensuring the file's data or a rejection will be returned
 */
function getFileData(filename) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filename, "utf8", function(err, fileData) {
            if (err) {
                reject(err);
            }
            else {
                resolve(fileData);
            }
        });
    });
}

/**
 * Loads the file data into the PML viewer
 * @param {String} fileData The data from the PML file in String format
 */
function loadFileDataToViewer(fileData) {
    
}