require('dotenv').config({path:'.env'});
const {Queue} = require('bullmq');
const renderQueue = new Queue('render-jobs', { connection: { host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379 } });
(async () => {
  try {
    const bullJob = await renderQueue.add('test', { foo: 'bar' });
    console.log("Success", bullJob.id);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
