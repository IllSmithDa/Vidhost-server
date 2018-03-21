# VidHost

Vidhost is a video hosting web application. 

# Routes
## `[Post]` '/video_create'
* Should post a new video into the database

## `[Get]` '/video_list'
* This request should return a list of videos 

# Models
## Video model
Video model includes the image source which will be a string, an id, as well as a channel name. View count will be a counter in the future but for now, simple enter a number

```
const VideoSchema = new Schema({
  id: Number,
  image_source:{
    type: String,
    required: true
  },
  video_name: {
    type: String,
    required: true
  },
  channel_name: String,
  viewer_count: Number,
});
```
# Controllers
## Video Controller
Video Controllers will utilize the standard requests to create or upload videos as well as deleting them.  
```
const videoCreate = (req, res) => {
  const { image_source, video_name } = req.body;
  const newVideo = new Video({ image_source, video_name });
  newVideo
    .save()
    .then(video => res.json(video))
    .catch(err => res.status(SERVER_ERROR_STATUS).json({ error: err.message }));
};
```