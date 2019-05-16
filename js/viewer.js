const remote = require('electron').remote;
const fs = require('fs');
const { dialog } = require('electron').remote;
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const nlp = require('nlp_compromise');
const nlpSyllables = require('nlp-syllables');

/**
 * Prompts the user for a PML file to load and then passes it to the parser
 */
window.onload = function() {
    console.time("loadPerformanceTimer");
    nlp.plugin(nlpSyllables);
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

    if (fileToLoadList == undefined) {
        remote.getCurrentWindow().close();
    }
   
    var fileToLoad = fileToLoadList[0];
    loadFile(fileToLoad);    
    
    // var testPMLFilepath = path.join(__dirname, '../test/test.pml');
    // loadFile(testPMLFilepath);
    console.timeEnd("loadPerformanceTimer");
    setTimeout(remote.getCurrentWindow().show(), 75);
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
    const dom = new JSDOM(removeWhitespace(fileData));
    var newDomRoot = document.implementation.createHTMLDocument("PML File");
    var styleElement = newDomRoot.createElement('style');
    styleElement.innerText = `
    p {
        margin-top: 0;
        margin-bottom: 0;
    }
    body {
        user-select: none;
    }
    `;
    document.head.appendChild(styleElement);
    document.styleSheets[0] = path.join(__dirname, '../assets/css/pmldisplay.css');

    var endElement = traverseDocument(dom.window.document.body.firstChild, '', newDomRoot);    
    document.body.innerHTML = (endElement.innerHTML);
}

function createSpaceElement() {
    return document.createElement('br');
}

function traverseDocument(node, classString, newDomRoot) {
    var isTextNode = checkIfTextNode(node);
    if (isTextNode) {
        // if (node.parentNode.tagName == 'sp') {
        //     return createSpaceElement();
        // }
        if (node.nodeValue == '\n' || node.nodeValue.trim() == '') {
            return null;
        }
        return createElement(node, classString);
    }

    var tagName = node.tagName;

    if (containsRS(tagName)) {
        if (!inRS) {
            toggleRS();
            classString += ' ' + tagName;
        } 
    }
    else {
        classString += ' ' + tagName;
    }

    var childrenElements = handleChildren(node, classString, newDomRoot);

    var pushableElement;
    var parentNode = node.parentNode;
    if (inRS) {
        pushableElement = wrapRS(childrenElements);
        // console.log("Pushable: " + pushableElement);
        
        parentNode.removeChild(node);
        parentNode.innerHTML = pushableElement;
        toggleRS();

        return pushableElement;
    }
    else {
        var divWrapped = wrapDiv(childrenElements);
        // console.log(divWrapped);
        return divWrapped;
    }
}

function wrapRS(elementsArray) {
    var typeRS = getTypeRS(elementsArray[0]);
    var RSElement = document.createElement(typeRS);

    var i;
    for (i = 0; i < elementsArray.length; ++i) {
        var current = elementsArray[i];
        if (current != null) {
            RSElement.appendChild(current);
        }
    }

    return RSElement;
}

function getTypeRS(element) {
    var classArray = element.className.split(' ');
    var i;
    for (i = 0; i < classArray.length; ++i) {
        var currentClass = classArray[i];
        if (currentClass.includes('RS')) return currentClass;
    }
    return undefined;
}

function wrapDiv(elementsArray) {
    var divElement = document.createElement('SPAN');

    if (elementsArray.length == 1) return elementsArray[0];
    var i;
    for (i = 0; i < elementsArray.length; ++i) {
        var current = elementsArray[i];
        if (current != null) {
            divElement.appendChild(current);
        }
       
    }

    return divElement;
}

NodeList.prototype.forEach = Array.prototype.forEach;
function handleChildren(node, classString, newDomRoot) {  
    var childrenElements = [];
    var children = node.childNodes;    
    children.forEach(function(item){
        childrenElements.push(traverseDocument(item, classString, newDomRoot));
    });

    return childrenElements;
}

function toggleRS() {
    inRS = !inRS;
}

function createElement(node, classString) {
    var element = document.createElement('p');
    element.innerText = node.nodeValue.trim();
    element.className = classString;
    return element;
}

function containsRS(string) {
    return string.includes('RS');
}

function checkIfTextNode(node) {
    var nodeType = node.nodeType;
    return nodeType == Node.TEXT_NODE;
}

function removeWhitespace(fileData) {
    // return fileData.replace(/[\t\r]+/g, '');
    var lines = fileData.split('\n');
    var returnData = '';
    var i;
    for (i = 0; i < lines.length; ++i) {
        var line = lines[i].trim();
        returnData += line + "\n";
    }
    // console.log(returnData);
    return returnData;
}

function appendChildToNewDom(text, styleString, newDomRoot) {
    var element = document.createElement('p');
    element.innerText = text.replace('\n', ' ').trim();
    element.className = styleString;

    if (includesNumbers(styleString)) {
        var RSElement = newDomRoot.getElementById(styleString[0]);
        var RSElementExists = RSElement !== null;
        // console.log(RSElementExists);
        if (!RSElementExists) {
            var elementName = getElementNameFromStyle(styleString);
            RSElement = document.createElement(elementName);
            RSElement.id = styleString[0];
            newDomRoot.body.append(RSElement);
        }
        RSElement.append(element);
    }
    
}

function getElementNameFromStyle(styleString) {
    var startingID = styleString.indexOf('RS', 2);
    var nextSpaceID = styleString.indexOf(' ', startingID + 2);
    if (nextSpaceID == -1) {
        return styleString.substring(startingID);
    }
    else {
        return styleString.substring(startingID, nextSpaceID);
    }
}

var nextRSID = 0;
var inRS = false;
function traverseElementConvertingPMLToHTML(element, styleString, newDomRoot) {//, meterName) {
    if (element.nodeType == Node.TEXT_NODE) {
        if (element.data == '\n') return;
        styleString = styleString.trimLeft();
        // console.log("TEXT: " + element.data);
        // console.log("Style String: " + styleString);
        if (inRS) {
            return 
        }
        appendChildToNewDom(element.data, styleString, newDomRoot);
        return;
    }

    NodeList.prototype.forEach = Array.prototype.forEach;
    var children = element.childNodes;

    var flattenedChildElements = null;

    if (!styleString.includes(element.tagName)) {
        if (element.tagName.includes('RS')) {
            if (!inRS) {
                inRS = true;
                flattenedChildElements = [];
                styleString += ' ' + element.tagName;
            }
            
            // var styleStringHasNumbers = includesNumbers(styleString);
            // if (!styleStringHasNumbers) {
            //     styleString = nextRSID + styleString;
            //     nextRSID++;
            //     styleString += ' ' + element.tagName;
            // }  
        }
        // else if (element.tagName.includes('M-')) {
                        
        //     children.forEach(function(item){
        //         traverseElementConvertingPMLToHTML(item, styleString, newDomRoot, element.tagName);
        //     });
        // }
        else {
            styleString += ' ' + element.tagName;
        }            
       
    } 

    children.forEach(function(item){
        flattenedChildElements.push(traverseElementConvertingPMLToHTML(item, styleString, newDomRoot));
    });

    if (inRS) {
        inRS = false;
    }
}

function includesNumbers(string) {
    var numbers = '0123456789';
    var i;
    for (i = 0; i < string.length; ++i) {
        var currentChar = string[i];
        //console.log(currentChar);
        if (numbers.includes(currentChar)) return true;
    }
    return false;
}

/**
 * Returns an array of syllables cut from the parameter string
 * @param {String} text The text to cut into syllables
 * @returns {Array} The syllables of the given text as an array of String objects
 */
function cutTextToSyllables(text) {
    return nlp.term(text).syllables();
}