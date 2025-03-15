const lz4 = require('lz4');
const { Buffer } = require('buffer');

class CompressionUtil {
  static compressString = async (inputString) => {
    return new Promise((resolve, reject) => {
      try {
        const input = Buffer.from(inputString, 'utf-8');
        const output = Buffer.alloc(lz4.encodeBound(input.length));
        const compressedSize = lz4.encodeBlock(input, output);
        const compressedBuffer = output.slice(0, compressedSize);
        resolve(compressedBuffer.toString('base64'));
      } catch (err) {
        reject(err);
      }
    });
  };

  static decompressString = async (compressedStringBase64) => {
    return new Promise((resolve, reject) => {
      try {
        const compressedBuffer = Buffer.from(compressedStringBase64, 'base64');
        const output = Buffer.alloc(compressedBuffer.length * 255);
        const uncompressedSize = lz4.decodeBlock(compressedBuffer, output);
        const decompressedBuffer = output.slice(0, uncompressedSize);
        resolve(decompressedBuffer.toString('utf-8'));
      } catch (err) {
        reject(err);
      }
    });
  };
}

module.exports = CompressionUtil;