const phantom = require('phantom');
const fs = require('fs');

(async function() {
    const instance = await phantom.create();
    const page = await instance.createPage();

    var ti, co;
    var urlPath = 'http://www.166xs.com/xiaoshuo/57/57720/';
    var urlFile = '29090842.html';
    var index = 1;
    const regexBr = /<br\s*[\/]?>/gi;
    const regexNbsp = /&nbsp;/g

    while(true)
    {
        await page.on("onResourceRequested", function(requestData) {
            console.info('Requesting', requestData.url)
        });

        const status = await page.open(urlPath + urlFile);
        console.log(status);

        //await page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js');
        await page.injectJs('./jquery-1.10.2.min.js');

        //page.evaluateJavaScript('function() { return document.getElementById(\'content\').innerHTML; }')
        await page.evaluateJavaScript('function() { $(".Book_Text .Book_Hot").remove(); $(".Book_Text script").remove(); $(".Book_Text .Banner").remove(); return {title:$("#content h2").html(), content:$(".Book_Text").html()};}')
        .then(function(html){
            ti = html.title;
            co = html.content.replace(regexBr, "\n").replace(regexNbsp, ' ');
        });

        fs.writeFile('./output/'+ urlFile + '.' + index + '.'+'.txt', ti + co, function(err) {
            if(err) {
                return console.log(err);
            }
        });

        await page.evaluateJavaScript('function() { return $("div.thumb a").filter(function(index) { return $(this).text() === "下一章"; }).attr("href"); }')
        .then(function(nextHref){
            urlFile = nextHref;
        });

        if (urlFile==='' || urlFile==='index.html') break;

        index ++;
    }

    await instance.exit();
}());