const { dialog } = require('electron').remote;
const remote = require('electron').remote;
const path = require('path');
var { clipboard } = require('electron');
const fs = require('fs');
/**
 * Performs all functions related to preparing the editor for use
 */
function prepareEditor() {
    //createToolbarListeners();
    createSaveButtonListener();
    createOpenButtonListener();
}

function createSaveButtonListener() {
    var editor = document.getElementById('editor');
    var saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', function(err) {
        var currentCode = getCurrentCode();
        undoSelect();
        showSaveDialogForData(currentCode);
    });
}

function createOpenButtonListener() {
    var editor = document.getElementById('editor');
    var openButton = document.getElementById('openButton');
    openButton.addEventListener('click', function(err) {
        var fileToLoadList = dialog.showOpenDialog(
        {
            properties: ['openFile'],
            filters: [
                {
                    name: 'PML File',
                    extensions: ['pml']
                }
            ]
        });

        if (fileToLoadList == undefined) {
            return;
        }

        var filename = fileToLoadList[0];
        
        var data = fs.readFileSync(filename, 'utf8');
        editorInsert(data);
    });
}

function showSaveDialogForData(currentCode) {
    dialog.showSaveDialog(remote.getCurrentWindow(), {
        defaultPath: 'new.pml'
    }, (filename) => 
    {
        if (filename === undefined) {
            return;
        }

        console.log(currentCode)
        // filename is a string that contains the path and filename created in the save file dialog.  
        fs.writeFile(filename, currentCode, 'utf8', (err) => {
            if(err){
                alert("An error ocurred creating the file "+ err.message)
                return;
            }
                        
            alert("The file has been succesfully saved");
        });
    }); 
}

/**
 * Creates all listeners related to inserting tags into the editor using the toolbar
 */
function createToolbarListeners() {    
    var toolbarBtnList = document.getElementsByClassName('toolbarBtn');
    var i;
    for (i = 0; i < toolbarBtnList.length; ++i) {
        var currentButton = toolbarBtnList[i];
        addToolbarClickListener(currentButton);
    }
}

/**
 * Adds a click listener for the given toolbar button element,
 * adds a listener that causes the button's innerText to be 
 * added to the editor text area on click
 * 
 * (Should be modified to add closing tags in the future)
 * @param {Element} toolbarBtn The element to add a click listner for
 */
function addToolbarClickListener(toolbarBtn) {
    var editorArea = document.getElementById('editorArea');
    toolbarBtn.addEventListener('click', function() {
        var initialLength = editorArea.value.length;
        var tagText = toolbarBtn.innerText + '\n\n</' + toolbarBtn.innerText.substring(1);
        
        var startPos = editorArea.selectionStart;
        var endPos = editorArea.selectionEnd;

        var selectionLength = endPos - startPos;
        var tagPastePos = startPos;
        editorArea.value = editorArea.value.substring(0, startPos + 1) + tagText + editorArea.value.substring(startPos + 1);

        var tagTextLength = tagText.length;
        var tagCenterIndex = startPos + tagTextLength / 2;

        editorArea.focus();
        editorArea.setSelectionRange(tagCenterIndex, tagCenterIndex);

        // if (toolbarBtn.innerText.includes('/')) {
        //     toolbarBtn.innerText = '<' + toolbarBtn.innerText.substring(2);
        // }
        // else {
        //     toolbarBtn.innerText = '</' +  toolbarBtn.innerText.substring(1);
        // }
    });
}

window.onload = prepareEditor;