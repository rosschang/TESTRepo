const phantom = require('phantom');
const fs = require('fs');

var debug = true;
var start = process.hrtime();

// var elapsed_time = function(note){
//     var precision = 3; // 3 decimal places
//     var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
//     console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message + time
//     start = process.hrtime(); // reset the timer
// }

function elapsed_time(note) {
    return new Promise(function (resolve, reject) {
        try {
            var precision = 3; // 3 decimal places
            var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
            var ou = process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note; // print message + time

            start = process.hrtime(); // reset the timer

            resolve(ou);
        } catch (err) {
            reject(new Error(err));
        }
    });
}

//try{

 
(async function () { 
    const instance = await phantom.create();
    const page = await instance.createPage();
    //instance.settings.resourceTimeout = 5000;

    page.setting('resourceTimeout', 5000);

    page.property('onResourceTimeout', function(e) {
       console.log(e.errorCode);   // it'll probably be 408 
        console.log(e.errorString); // it'll probably be 'Network timeout on resource'
        console.log(e.url);         // the url whose request timed out
      });

    var ti, co;
    var urlPath = 'http://www.166xs.com/xiaoshuo/50/50578/';
    var urlFile = '10395795.html';
    var outFile;
    var outFileFinal = 'scrap_output.txt';
    var index = 1;
    const regexBr = /<br\s*[\/]?>/gi;
    const regexNbsp = /&nbsp;/g;

    // appears to be faster without this event tied up
    // await page.on("onResourceRequested", function(requestData) {
    //         console.info('Requesting', requestData.url)
    //     });

    //if(debug) elapsed_time("start loop");
    //console.time('scrap');
    if (debug) console.log(await elapsed_time('start '));

    var wstream = await fs.createWriteStream('./' + outFileFinal);

    while (true) {
        const status = await page.open(urlPath + urlFile);
        console.log(status);

        if(status === 'fail') continue; // load failed, try again.

        //await page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js');
        await page.injectJs('./jquery-1.10.2.min.js');

        //page.evaluateJavaScript('function() { return document.getElementById(\'content\').innerHTML; }')
        await page.evaluateJavaScript('function() { $(".Book_Text .Book_Hot").remove(); $(".Book_Text script").remove(); $(".Book_Text .Banner").remove(); return {title:$("#content h2").html(), content:$(".Book_Text").html(), nextHref: $("div.thumb a").filter(function(index) { return $(this).text() === "下一章"; }).attr("href")};}')
            .then(function (html) {
                ti = html.title;
                co = html.content.replace(regexBr, "\n").replace(regexNbsp, ' ');
                outFile = urlFile;
                urlFile = html.nextHref;
            });

        // fs.writeFile('./output/' + outFile + '.' + index + '.txt', ti + co, function (err) {
        //     if (err) {
        //         return console.log(err);
        //     }
        // });

        wstream.write(ti + co + '\n\n' , function(err){
            if(err){return console.log(err);}
        });

        // Dont have to evaluate twice, just include the data in JSON returned above.
        // await page.evaluateJavaScript('function() { return $("div.thumb a").filter(function(index) { return $(this).text() === "下一章"; }).attr("href"); }')
        // .then(function(nextHref){
        //     urlFile = nextHref;
        // });

        if (urlFile === '' || urlFile === 'index.html') break;

        index++;

        //if (index > 10 ) break; // short loop use for debugging purpose.
    }
    //if(debug) elapsed_time("end loop");
    //console.timeEnd('scrap');
    if (debug) console.log(await elapsed_time('end '));

    await wstream.end();
    await wstream.close();
    await instance.exit();
}());
  
//}
//finally
//{

//}