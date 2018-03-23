'use strict';

const crypto = require('crypto');

const secret = 'ahahachat';

module.exports = password => {
  const hash = crypto.createHmac('sha256', secret)
    .update(password)
    .digest('hex');
  return hash;
};
