const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const gridfs = require('gridfs-stream');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const server = express();
const routes = require('./api/routes/routes');
const port = 5000;
const config = require('./config')

mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${config.username}:${config.password}@ds117469.mlab.com:17469/vidhost`, { useMongoClient: true });
server.use(bodyParser.json());
const corsOption = {
  origin: 'http://localhost:3000',
  credentials: true,
};
server.use(cors(corsOption));
server.use(fileUpload());

gridfs.mongo = mongoose.mongo;
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  routes(server);
});
server.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
});

server.use(session({
  store: new MongoStore({url: `mongodb://${config.username}:${config.password}@ds117469.mlab.com:17469/vidhost`}),
  secret: 'e5SPiqsEtjexkTj3Xqovsjzq8ovjfgVDFMfUzSmJO21dtXs4re',
  resave: false,
  saveUninitialized: false,
  rolling: false,
  cookie: {
    secure: false,
    expires: 999999999,
    httpOnly: false
  }
}))
module.exports = { server };