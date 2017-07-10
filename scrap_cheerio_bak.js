var phantom = require('phantom');
var fs = require('fs');
var Q = require('q');
var cheerio = require('cheerio');

var _ph, _page, _outObj;
var urlPath = 'http://www.166xs.com/xiaoshuo/57/57720/';
var urlFile = '29090842.html';
var outFile;
var index = 1;

const regexBr = /<br\s*[\/]?>/gi;
const regexNbsp = /&nbsp;/g

phantom.create().then(ph => {
    _ph = ph;
    return _ph.createPage();
}).then(page => {  // should break this PROMISE statement and use await, put in loop.
    _page = page;
    return _page.open(urlPath + urlFile);
}).then(status => {
    console.log(status);
    return waitState(textPopulated, 3);
}).then(() => {
    return _page.property('content');
}).then(content => {

    var $ = cheerio.load(content, {decodeEntities: false});

    $(".Book_Text .Book_Hot").remove(); 
    $(".Book_Text script").remove(); 
    $(".Book_Text .Banner").remove(); 
    
    var btitle = $("#content h2").html();
    var btxt = $('.Book_Text').html()
    var btxt = btxt.replace(regexBr, "\n").replace(regexNbsp, ' ');
    var nextFile = $("div.thumb a").filter(
        function(index) { return $(this).text() === "下一章"; }).attr("href");

    fs.writeFile('./output/' + urlFile + '.txt', btxt, function (err) {
        if (err) {
            return console.log(err);
        }
    });
    
    urlFile = nextFile;
    index ++;

    _page.close();
    _ph.exit();
  
}).catch(e => console.log(e));

function textPopulated() {
    return _page.evaluate(function() {
        //return document.querySelector('#app').outerHTML;
        return document.querySelector('html').outerHTML;
    }).then(function(html) {
        return html;
    });
}

function waitState(state, timeout) {  // timeout in seconds is optional
    console.log('Start waiting for state: ' + state.name);

    var limitTime = timeout * 1000 || 20000;
    var startTime = new Date();

    return wait();

    function wait() {
        return state().then(function(result) {
            if (result) {
                console.log('Reached state: ' + state.name);
                return;
            } else if (new Date() - startTime > limitTime) {
                var errorMessage = 'Timeout state: ' + state.name;
                throw new Error(errorMessage);
            } else {
                return Q.delay(50).then(wait);
            }
        }).catch(function(error) {
            throw error;
        });
    }
}