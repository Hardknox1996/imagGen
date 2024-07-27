const express = require('express');
const puppeteer = require('puppeteer');
const GIFEncoder = require('gif-encoder-2');
const { PassThrough } = require('stream');

const app = express();
const port = 3002;

// Function to generate an image with countdown
async function generateCountdownImage(secondsLeft) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const htmlContent = `
    <html><head></head>
      <body>
        <h1>Countdown Timer</h1>
        <p>Time left: <span>${secondsLeft}</span> seconds</p>
      </body></html>`;

  await page.setContent(htmlContent);
  await page.setViewport({ width: 400, height: 300 }); // Set viewport size
  const imageBuffer = await page.screenshot({ type: 'png' });
  
  await browser.close();
  
  return imageBuffer;
}

// Endpoint to generate the countdown GIF
app.get('/countdown', async (req, res) => {
  const totalFrames = 60; // Number of frames in the GIF
  const delay = 1000; // 1 second delay between frames
  const width = 400; // Width of the GIF
  const height = 300; // Height of the GIF

  // Set up GIF encoder
  const encoder = new GIFEncoder(width, height);
  res.setHeader('Content-Type', 'image/gif');

  // Create a stream for the GIF data
  const passThroughStream = new PassThrough();
  encoder.createReadStream().pipe(passThroughStream);

  // Start GIF encoding
  encoder.start();
  encoder.setRepeat(0); // Loop the GIF
  encoder.setDelay(delay); // Delay between frames
  encoder.setQuality(10); // Quality of the GIF

  // Stream GIF data to the response
  passThroughStream.pipe(res);

  try {
    for (let i = 0; i < totalFrames; i++) {
      const secondsLeft = totalFrames - i - 1;
      const imageBuffer = await generateCountdownImage(secondsLeft);

      // Convert the imageBuffer to a format suitable for GIF encoding
      const image = new Uint8Array(imageBuffer);

      // Add each frame to the GIF encoder
      encoder.addFrame(image);
    }
    encoder.finish(); // Finish GIF encoding
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating the GIF');
  }
});

// Existing /test endpoint
app.get('/test', async (req, res) => {
  let { utmfname, utmlname, width, height } = req.query;
  let fname = utmfname || "test";
  let lname = utmlname || "test";

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    if (width && height) {
        await page.setViewport({ width: parseInt(width), height: parseInt(height) });
    }

    const htmlContent = `
        <html>
          <head></head>
          <body style="margin: 0; background: #984dff; padding-left: 20px; padding-right: 20px;">
            <h1 style="color: #fff;">Say hello to image generator</h1>
            <p style="color: #fff;">Welcome <span style="color: #ade31a; font-weight: 700;">${fname}</span> <span style="color: aqua;">${lname}</span></p>
          </body>
        </html>`;
    await page.setContent(htmlContent);
    const imageBuffer = await page.screenshot({ type: 'png' });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating the image');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
