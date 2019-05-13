/**
 * Performs all functions related to preparing the editor for use
 */
function prepareEditor() {
    createToolbarListeners();
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
        editorArea.value += toolbarBtn.innerText;
    });
}

window.onload = prepareEditor;