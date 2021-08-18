/* eslint-disable prettier/prettier */
const IPFS = require('ipfs');
const all = require('it-all');
const uint8ArrayConcat = require('uint8arrays/concat');
const uint8ArrayFromString = require('uint8arrays/from-string');
const uint8ArrayToString = require('uint8arrays/to-string');
const sharp = require('sharp');

async function ipfs() {
  const node = await IPFS.create();
  const version = await node.version();

  console.log('Version:', version.version);

  const data = await all(
    node.cat('bafkreielucidvrytaoex7sajjs4om44reaxvtcqgxmd4e2cxzueb7icnem'),
  );

  const semiTransparentRedPng = await sharp(data[0])
  .rotate()
  .resize(200)
  .jpeg({ mozjpeg: true })
  .toBuffer()
  return semiTransparentRedPng; //sharp(data).resize(320, 240);

  // console.log('Added file contents:', uint8ArrayToString(data));
  // return {
  //   imagen: Buffer.from(data, 'binary').toString(),
  //   extension: 'base64',
  // };
}

// ipfs();

var path = require('path');
var express = require('express');
var app = express();
var fs = require('fs');

var dir = path.join(__dirname, 'public');

var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

app.get('*', async function (req, res) {
    // var file = path.join(dir, req.path.replace(/\/$/, '/index.html'));
    // if (file.indexOf(dir + path.sep) !== 0) {
    //     return res.status(403).end('Forbidden');
    // }
    // var type = mime[path.extname(file).slice(1)] || 'text/plain';
    const abc = await ipfs();
    // var s = fs.createReadStream(Buffer.from(abc, 'base64'));
    // console.log('====>', s)
    // const fileContents = Buffer.from(abc, 'base64')
    // fs.writeFile('aaaa1.png', fileContents, (err) => {
    //   if (err) return console.error(err)
    //   console.log('file saved to ', 'aaa.png')
    // })
    // s.on('open', function () {
    //     res.set('Content-Type', 'image/jpeg');
    //     s.pipe(res);
    // });
    // s.on('error', function () {
    //     res.set('Content-Type', 'text/plain');
    //     res.status(404).end('Not found');
    // });
    // return fileContents;
    res.contentType('image/jpeg');
    res.send(Buffer.from(abc, 'binary'))
    // return res.end(abc, 'binary')
});

app.listen(3000, function () {
    console.log('Listening on http://localhost:3000/');
});
