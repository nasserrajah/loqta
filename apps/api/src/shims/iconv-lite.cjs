'use strict';

function unsupported() {
  throw new Error('iconv-lite is not available on Cloudflare Workers');
}

module.exports = {
  encodingExists: (encoding) => encoding === 'utf-8' || encoding === 'utf8',
  decode: unsupported,
  encode: unsupported,
};