const gridfs = require('gridfs-stream');
const ffmpeg = require('fluent-ffmpeg');
const local_file = "./api/controllers/test.jpg";
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Video = require('../models/videoModels');
const fs = require('fs');   
const STATUS_USER_ERROR = 422;

const STATUS_SERVER_ERROR = 500;

const uploadVideo = (req, res) => {
  gridfs.mongo = mongoose.mongo;
  const connection = mongoose.connection;
  const gfs = gridfs(connection.db);

  if (!req.files)
    return res.status(400).send('No files were uploaded.');
  
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.video_file;
  const { username } = req.params;
  const { videoName } = req.body;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(`./api/controllers/server/${videoName}`, function(err) {
    if (err) return res.status(500).send(err);
  });
  ffmpeg(`./api/controllers/server/${videoName}`)
  .on('end', function() {
    console.log('Screenshots taken');
    let writestream2 = gfs.createWriteStream({ filename: 'tn.png' });
    let readstream2 = fs.createReadStream(`./api/controllers/server/thumbnails/tn.png`).pipe(writestream2);
    fs.unlink(`./api/controllers/server/thumbnails/tn.png`, err => {
      if (err) throw err;
     //console.log('file deleted!')
    });
    writestream2.on('close', (file) => {
      let data = '';
      let readstream3 = gfs .createReadStream({_id: writestream2.id});
      readstream3.setEncoding('base64');
      readstream3.on('data', (chunk) => {
        data += chunk;
      })
      readstream3.on('end' , () => {
        let newString = `data:image/png;base64, ${data}`;
        newString = newString.replace(/\s/g, "");
        let writestream = gfs.createWriteStream({ filename: videoName });
        let readStream = fs.createReadStream(`./api/controllers/server/${videoName}`).pipe(writestream);
        readStream.on('error', function (err) {
          console.log('An error occurred!', err);
          throw err;
        });
        writestream.on('close', (file) => {
          User.findOne({username})
          .exec()
          .then(user => {
            const newVideo = {videoID: writestream.id, videoName: videoName, videoThumbnail: newString, thumbnailID: writestream2.id, videoUploader: username }
            user.videoList.push(newVideo)
            user.save()
            .then(() => {
              fs.unlink(`./api/controllers/server/${videoName}`, err => {
                if (err) throw err;
              });
              res.writeHead(301, {Location: `http://localhost:3000/my_channel/${username}`})
              res.end();
            })
            .catch(err => {
              res.json({ error: err.message });
            });
          });
        });
      })
    })
  })
  .on('error', function(err) {
    console.error(err);
  })
  .screenshots({
    // Will take screenshots at 20%, 40%, 60% and 80% of the video
    count: 1,
    folder: './api/controllers/server/thumbnails',
    size: '200x150'
  });
};
const streamVideo = (req, res) => {
  const connection = mongoose.connection;
  gridfs.mongo = mongoose.mongo;
  const gfs = gridfs(connection.db);

  // Check file exist on MongoDB
  const { videoID, userID } = req.params;
  User.findOne({username: userID})
    .then((data) => {
      let videoData = '';
      for(let i = 0; i < data.videoList.length; i++) {
        if (data.videoList[i].videoID === videoID) {
          videoData = data.videoList[i]
        }
      }
      gfs.exist({filename: videoData.videoName}, (err, file) => {
        if (err || !file) {
          res.send('File Not Found');
        } else {
          let readStream = gfs.createReadStream({ _id: videoData.videoID });
          readStream.pipe(res);
        }
      });
    })
    .catch(err => {
      res.status(STATUS_USER_ERROR).json({ error: err.message});
    })
} 

const getVideoList = (req, res) => {
  const { username } = req.params;
  User.findOne({username: username})
    .exec()
    .then(video => {
      res.json(video)
    })
    .catch(err => {
      res.status(SERVER_ERROR_STATUS).json({ error: err.message});
    });
};

const getVideoInfo = (req, res) => {
  // Check file exist on MongoDB
  const { videoID } = req.params;
  User.find({})
    .then(user => {
      let userInfo = '';
      for(let i = 0; i < user.length; i++) {
        for(let j = 0; j < user[i].videoList.length; j++) {
          if(user[i].videoList[j].videoID === videoID) {
            userInfo = user[i].videoList[j];
          }
        }
      }
      res.status(200).json(userInfo)
    })
    .catch(err => {
      res.status(SERVER_ERROR_STATUS).json({ error: err.message});
    })
}

const addComment = (req, res) => {
  const {comment, username, videoUploader} = req.body;
  const {videoID} = req.params;
  User.findOne({username: videoUploader})
    .then((user) => {
      let index = 0;
      for(let j = 0; j < user.videoList.length; j++) {
        if (user.videoList[j].videoID === videoID) {
          user.videoList[j].comments.push({comment: comment, username: username})
          index = j;
        }
      }
      user
        .save()
        .then((data) => {
          // return data back to the client side
          res.json(data.videoList[index].comments);
        })
        .catch((err) => {
          res.json({ error: err.message });
        });
    })
    .catch((err) => {
      res.json({ error: err.message });
    });
};

const addReply = (req, res) => {
  const {replayStatement, videoUploader, username, videoID, index} = req.body;
  User.findOne({username: videoUploader})
    .then(user => {
      let commentIndex = 0;
      for (i = 0; i < user.videoList.length; i++) {
        if (user.videoList[i].videoID === videoID) {
          user.videoList[i].comments[index].replies.push({username: username, comment: replayStatement})
          commentIndex = i;
          break;
        } 
      }
      user
        .save()
        .then((data) => {
          res.status(200).json(data.videoList[commentIndex].comments[index].replies)
        })
        .catch(err => {
          res.status(STATUS_SERVER_ERROR).json({ error: err.message });
        })
    })
    .catch(err => {
      res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    })
}
const getReplies = (req, res) => {
  const {videoUploader, videoID, index} = req.body;
  User.findOne({username: videoUploader})
    .then(user => {
      let commentIndex = 0;
      for (i = 0; i < user.videoList.length; i++) {
        if (user.videoList[i].videoID === videoID) {
          commentIndex = i;
          break;
        } 
      }
      user
        .save()
        .then((data) => {
          res.status(200).json(data.videoList[commentIndex].comments[index].replies)
        })
        .catch(err => {
          res.status(STATUS_SERVER_ERROR).json({ error: err.message });
        })
    })
    .catch(err => {
      res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    })
}

const deleteVideo = (req, res) => {
  const connection = mongoose.connection;
  gridfs.mongo = mongoose.mongo;
  const gfs = gridfs(connection.db);

  const {username} = req.params;
  // becomes an array to iterate through 
  const videoDelete = req.body;
  User.findOne({ username })
    .then(data => {
     let thumbnailIDs =[];
      for(let i = 0; i < videoDelete.length; i++) {
        for(let j = 0; j < data.videoList.length; j++) {
          if (videoDelete[i] === data.videoList[j].videoID) {
            thumbnailIDs.push(data.videoList[j].thumbnailID)
            data.videoList.splice(j, 1)
          }
        }
      }
      data
        .save()
        .then(() => {
          for(let i = 0; i < videoDelete.length; i++) {
            gfs.remove({ _id: videoDelete[i] });
            gfs.remove({ _id: thumbnailIDs[i] });
          }
          res.status(200).json({ sucess:true });
        })
        .catch(err => {
          res.status(500).json({ error: err.message });
        })
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    })

}
const getAllVideos = (req, res) => {
  User.find({})
    .then(data => {
      let videoList = [];
      for(let i = 0; i < data.length; i++) {
        for(let j = 0; j < data[i].videoList.length; j++) {
          videoList.push(data[i].videoList[j])
        }
      }
      res.status(200).json(videoList);
    })
    .catch(err => {
      res.status(422).json({ error: err.message });
    });
};
const searchVideos = (req, res) => {
  let {searchTerm} = req.body;
  searchTerm = searchTerm.replace(/%20/g, " ");
  console.log(searchTerm);
  User.find({})
    .then(data => { 
      let videoList = [];
      for(let i = 0; i < data.length; i++) {
        for(let j = 0; j < data[i].videoList.length; j++) {
          if (searchTerm === data[i].videoList[j].videoName) {
          videoList.push(data[i].videoList[j])
          }
        }
      }
      res.status(200).json(videoList);
    })
    .catch(err => {
      res.status(SERVER_ERROR_STATUS).json({ error: err.message })
    });
};
module.exports = {
  getVideoList,
  uploadVideo, 
  streamVideo,
  getVideoInfo,
  addComment,
  addReply,
  deleteVideo,
  getAllVideos,
  searchVideos,
  getReplies
}