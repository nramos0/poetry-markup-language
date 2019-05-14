const path = require('path');

/**
 * Performs all functions related to preparing the editor for use
 */
function prepareEditor() {
    //createToolbarListeners();
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