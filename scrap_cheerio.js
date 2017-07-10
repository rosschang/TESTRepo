var phantom = require('phantom');
var fs = require('fs');
var Q = require('q');
var cheerio = require('cheerio');

(async function () {

    var urlPath = 'http://www.166xs.com/xiaoshuo/57/57720/';
    var urlFile = '29090842.html';
    var outFile;
    var index = 1;

    const regexBr = /<br\s*[\/]?>/gi;
    const regexNbsp = /&nbsp;/g

    const _ph = await phantom.create();
    const _page = await _ph.createPage();

    console.log('page object created. Starting Loop');

    while (true) {
        const status = await _page.open(urlPath + urlFile);
        //console.log(status);

        await _page.evaluate(function () {
            return document.querySelector('html').outerHTML;
        }).then(function (html) {
            return html;
        });

        var $ = await cheerio.load(await _page.property('content'), {decodeEntities: false});

        $(".Book_Text .Book_Hot").remove();
        $(".Book_Text script").remove();
        $(".Book_Text .Banner").remove();

        var btitle = $("#content h2").html();
        var btxt = $('.Book_Text').html().replace(regexBr, "\n").replace(regexNbsp, ' ');
        //var btxt = btxt.replace(regexBr, "\n").replace(regexNbsp, ' ');
        var nextFile = $("div.thumb a").filter(
            function (index) {return $(this).text() === "下一章";}).attr("href");

        fs.writeFile('./output/' + urlFile + '.txt', btitle + '\n' + btxt, function (err) {
            if (err) {
                return console.log(err);
            }
        });

        console.log(index + ' . ' + btitle);
        urlFile = nextFile;
        index++;
        if (urlFile === '' || urlFile === 'index.html') break;
    }

    console.log('While Loop ended.');
    await _page.close();
    await _ph.exit();
}());


async function textPopulated() {
    return await _page.evaluate(function () {
        //return document.querySelector('#app').outerHTML;
        return document.querySelector('html').outerHTML;
    }).then(function (html) {
        return html;
    });
}

// not sure how this work
function waitState(state, timeout) { // timeout in seconds is optional
    console.log('Start waiting for state: ' + state.name);

    var limitTime = timeout * 1000 || 20000;
    var startTime = new Date();

    return wait();

    function wait() {
        return state().then(function (result) {
            if (result) {
                console.log('Reached state: ' + state.name);
                return;
            } else if (new Date() - startTime > limitTime) {
                var errorMessage = 'Timeout state: ' + state.name;
                throw new Error(errorMessage);
            } else {
                return Q.delay(50).then(wait);
            }
        }).catch(function (error) {
            throw error;
        });
    }
}