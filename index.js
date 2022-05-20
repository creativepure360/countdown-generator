const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gifencoder");
const date = require("date-and-time");

const server = express();

server.get("/", async (request, response, next) => {
  try {
    const canvas = createCanvas(
      parseInt(request.query.width),
      parseInt(request.query.height)
    );
    const context = canvas.getContext("2d");

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = `#${request.query.fontColor}`;
    context.font = `${parseInt(request.query.fontSize)}px Arial bold`;

    const encoder = new GIFEncoder(
      parseInt(request.query.width),
      parseInt(request.query.height)
    );

    const stream = encoder.createReadStream().pipe(response);

    encoder.start();

    encoder.setRepeat(0);
    encoder.setDelay(1000);
    encoder.setQuality(9);

    const image = await loadImage(decodeURIComponent(request.query.image));
    let now = new Date();

    for (let i = 0; i < parseInt(request.query.frames); i++) {
      const days = Math.floor(
        date.subtract(new Date(request.query.end), now).toDays()
      );
      const hours = `0${Math.floor(
        date.subtract(new Date(request.query.end), now).toHours() -
          days * 24
      )}`.slice(-2);
      const minutes = `0${
        Math.floor(
          date.subtract(new Date(request.query.end), now).toMinutes()
        ) -
        days * 24 * 60 -
        hours * 60
      }`.slice(-2);
      const seconds = `0${
        Math.floor(
          date.subtract(new Date(request.query.end), now).toSeconds()
        ) -
        days * 24 * 60 * 60 -
        hours * 60 * 60 -
        minutes * 60
      }`.slice(-2);

      context.drawImage(
        image,
        0,
        0,
        parseInt(request.query.width),
        parseInt(request.query.height)
      );

      let time;

      if (
        date.subtract(new Date(request.query.end), now).toSeconds() <=
        0
      ) {
        time = "0:00:00:00";
      } else {
        time = `${days}:${hours}:${minutes}:${seconds}`;
      }

      let align;

      switch(request.query.align) {
        case "left":
          align = 4;
          break;
        case "right":
          align = 1.33;
          break;
        case "center":
        default:
          align = 2;
          break;
      }

      let valign;

      switch(request.query.valign) {
        case "top":
          valign = 4;
          break;
        case "bottom":
          valign = 1.33;
          break;
        case "middle":
        default:
          valign = 2;
          break;
      }

      context.fillText(
        time,
        parseInt(request.query.width) / align,
        parseInt(request.query.height) / valign
      );
      encoder.addFrame(context);

      now = date.addSeconds(now, 1);
    }

    encoder.finish();

    return new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  } catch (error) {
    next(error);
  }
});
server.listen(3000, () => {});
