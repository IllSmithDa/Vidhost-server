const gridfs = require('gridfs-stream');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const fs = require('fs');
const STATUS_USER_ERROR = 422;

const updateProfilePic = (req, res) => {
  const connection = mongoose.connection;
  gridfs.mongo = mongoose.mongo;
  const gfs = gridfs(connection.db);
  
  if (!req.files)
    return res.status(400).send('No files were uploaded.');
  
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.profPictureFile;
  
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(`./api/controllers/server/${sampleFile.name}`, function(err) {
    if (err) return res.status(500).send(err);
    let writestream = gfs.createWriteStream({ filename: sampleFile.name });
    let readStream = fs.createReadStream(`./api/controllers/server/${sampleFile.name}`).pipe(writestream)

    readStream.on('error', function (err) {
      console.log('An error occurred!', err);
      throw err;
    });
    writestream.on('close', (file) => {
      const { username } = req.params;
      User.findOne({username})
      .exec()
      .then(user => {
        if (user.profilePicture !== '5a623cabae2bd6411020ceb0') {
          gfs.remove({ _id: user.profilePicture })
        }
        user.profilePicture = writestream.id;
        user.profilePictureName = writestream.name;
        user.save()
        .then(() => {
          fs.unlink(`./api/controllers/server/${sampleFile.name}`, err => {
            if (err) throw err;
            console.log('file deleted!')
            res.writeHead(301, {Location: `http://localhost:3000/my_channel/${username}`})
            res.end();  
          });
        })
        .catch(err => {
          res.status(STATUS_USER_ERROR).json({ error: err.message });
        });
      });
    });
  })
}

const viewProfilePic = (req, res) => {
  gridfs.mongo = mongoose.mongo;
  const connection = mongoose.connection;
  const gfs = gridfs(connection.db);
  const { username } = req.params;
    User.findOne({ username })
      .exec()
      .then(user => {
        // console.log(user)
        gfs.exist({ filename: user.profilePictureName }, (err, file) => {
          if (err || !file) {
            user.profilePicture = '5a623cabae2bd6411020ceb0';
            let readstream = gfs.createReadStream({_id: user.profilePicture});
            readstream.setEncoding('base64');
            readstream.on('data', (chunk) => {
              data += chunk;
            })
            readstream.on('end' , () => {
              res.json(data);
            });
          } else {
            let data = '';
            let readstream = gfs.createReadStream({_id: user.profilePicture});
            readstream.setEncoding('base64');
            readstream.on('data', (chunk) => {
              data += chunk;
            })
            readstream.on('end' , () => {
              res.json(data);
            })
          }
        });
      })
  
}

const streamMedia = (req, res) => {
 
}

module.exports = {
  updateProfilePic, 
  viewProfilePic
}