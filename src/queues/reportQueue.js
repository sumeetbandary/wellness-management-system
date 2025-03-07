const { Queue } = require('bullmq');

const reportQueue = new Queue('reportQueue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

module.exports = reportQueue; 