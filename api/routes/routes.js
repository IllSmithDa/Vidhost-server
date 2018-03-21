const videoControllers = require('../controllers/videoControllers');
const userControllers = require('../controllers/userController');
const profPicController = require('../controllers/profPicController')
const middleware = require('../controllers/middleware/middleware')
module.exports = (app) => {
  app
    .route('/upload_video/:username')
    .post(videoControllers.uploadVideo);
  app
    .route('/video_list/:username')
    .get(videoControllers.getVideoList)
  app 
    .route('/streamVideo/:videoID/:userID')
    .get(videoControllers.streamVideo)
  app 
    .route('/videoInfo/:videoID')
    .get(videoControllers.getVideoInfo)
  app
    .route('/addComment/:videoID')
    .post(videoControllers.addComment)
  app
    .route('/get_replies')
    .post(videoControllers.getReplies)
  app
    .route('/add_reply')
    .post(videoControllers.addReply)
  app
    .route('/getAllVideos')
    .get(videoControllers.getAllVideos)
  app
    .route('/delete_video/:username')
    .post(videoControllers.deleteVideo)
  app
    .route('/search_videos')
    .post(videoControllers.searchVideos)
  app
    .route('/user_create')
    .post(middleware.hashedPassword, userControllers.createUser)
  app
    .route('/find_user')
    .post(userControllers.findUser)
  app
    .route('/get_username')
    .get(userControllers.getUserName)
  app
    .route('/user_logout')
    .get(userControllers.logout)
  app
    .route('/upload_profile_pic/:username')
    .post(profPicController.updateProfilePic)
  app
    .route('/show_profile_pic/:username')
    .get(profPicController.viewProfilePic)
}