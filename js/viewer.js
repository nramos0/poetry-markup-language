const remote = require('electron').remote;
const { dialog } = require('electron').remote;
const fs = require('fs');
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
    // var fileToLoadList = dialog.showOpenDialog(
    //     {
    //         properties: ['openFile'],
    //         filters: [
    //             {
    //                 name: 'PML File',
    //                 extensions: ['pml']
    //             }
    //         ]
    //     }
    // );
    // var fileToLoad = fileToLoadList[0];

    // loadFile(fileToLoad);    
    
    var testPMLFilepath = path.join(__dirname, '../test/test.pml');
    loadFile(testPMLFilepath);
    console.timeEnd("loadPerformanceTimer");
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
    newDomRoot.head.appendChild(styleElement)

    traverseElementConvertingPMLToHTML(dom.window.document.body.firstChild, '', newDomRoot);
    document.replaceChild(
        document.importNode(newDomRoot.documentElement, true),
        document.documentElement
    );
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
    console.log(returnData);
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
function traverseElementConvertingPMLToHTML(element, styleString, newDomRoot) {
    if (element.nodeType == Node.TEXT_NODE) {
        if (element.data == '\n') return;
        styleString = styleString.trimLeft();
        // console.log("TEXT: " + element.data);
        // console.log("Style String: " + styleString);
        appendChildToNewDom(element.data, styleString, newDomRoot);
        return;
    }

    if (!styleString.includes(element.tagName)) {
        if (element.tagName.includes('RS')) {
            var styleStringHasNumbers = includesNumbers(styleString);
            if (!styleStringHasNumbers) {
                styleString = nextRSID + styleString;
                nextRSID++;
                styleString += ' ' + element.tagName;
            }  
        }
        else {
            styleString += ' ' + element.tagName;
        }            
       
    } 

    NodeList.prototype.forEach = Array.prototype.forEach;
    var children = element.childNodes;
    children.forEach(function(item){
        traverseElementConvertingPMLToHTML(item, styleString, newDomRoot);
    });
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