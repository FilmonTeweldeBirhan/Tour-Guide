const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED Exception! 💥 Shutting down...');
  process.exit(1);
});

const app = require('./app');

(async () => {
  // SERVER
  const [port, host] = [process.env.PORT || 9000, '127.0.0.1'];
  const server = app.listen(port, host, () => {
    console.log(`Listening on port http://${host}:${port}...`);
  });

  process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    server.close(() => {
      process.exit(1);
    });
  });

  // DATABASE
  const conn = await mongoose.connect(process.env.DATABASE);
  // console.log(conn.connections);
  console.log('DB Connected successfully!.');
})();

console.log(process.env.NODE_ENV);
