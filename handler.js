'use strict';

const app = require('./server');
const serverless = require('serverless-http');

module.exports.hello = serverless(app);
