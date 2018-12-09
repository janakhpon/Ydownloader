var
    express = require('express'),
    app = express(),
    fs = require('fs'),
    ytdl = require('ytdl-core'),
    ffmpeg = require('fluent-ffmpeg'),
    readline = require('readline'),
    colors = require("colors/safe"),
    path = require('path'),
    bodyParser = require('body-parser'),
    port = process.env.PORT || 3200;


app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);
app.use(require("body-parser").urlencoded({
    extended: true
}));


app.get("/", function (req, res) {
    res.render("index");
});


app.post("/audio", function (req, res) {


    let id = req.body.audiourl;
    let name = req.body.audioname;

    let stream = ytdl(id, {
        quality: 'highestaudio',
        //filter: 'audioonly',
    });

    let start = Date.now();
    ffmpeg(stream)
        .audioBitrate(128)
        .save(`${__dirname}/${name}.mp3`)
        .on('progress', (p) => {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`${p.targetSize}kb downloaded`);
        })
        .on('end', () => {
            console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
            res.render('index');
        });

})

app.post("/video", function (req, res) {
    let name = req.body.videoname;
    let url = req.body.videourl;
    const output = path.resolve(__dirname, name + '.mp4');


    const video = ytdl(url);
    let starttime;
    video.pipe(fs.createWriteStream(output));
    video.once('response', () => {
        starttime = Date.now();
    });
    video.on('progress', (chunkLength, downloaded, total) => {
        const floatDownloaded = downloaded / total;
        const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${(floatDownloaded * 100).toFixed(2)}% downloaded`);
        process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
        process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
        process.stdout.write(`, estimated time left: ${(downloadedMinutes / floatDownloaded - downloadedMinutes).toFixed(2)}minutes `);
        readline.moveCursor(process.stdout, 0, -1);
    });
    video.on('end', () => {
        process.stdout.write('\n\n');
        res.render('index');

    });

   

})


app.listen(port);
console.log(
    colors.magenta(`\t GDownloader \t is running on port -> 127.0.0.1:${port}`)
);


