const User = require('../models/userModel');
const bcrypt = require('bcrypt'); 
// add more requests status
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const createUser = (req, res) => {
  const { username } = req.body;
  const hashedPassword = req.password
  const newUser = new User({ username, password: hashedPassword });
  newUser 
    .save()
    .then((createdUser) => {
      req.session.username = username;
      res.json(createdUser);
    })
    .catch((err) => {
      res.status(STATUS_USER_ERROR).json(err);
      return;
    });
};
const findUser = (req, res) => {
  const { username, password } = req.body;
  User.findOne({username}, (err, user) => {
    if (err || user === null) {
      sendUserError('No user found at that id', res);
      return;
    }
    const hashedPassword = user.password;
    bcrypt
      .compare(password, hashedPassword)
      .then(response => {
        if (!response) throw new Error();
        req.session.username = user.username;
        res.json({ success: true });
      })
      .catch(err => {
        res.status(STATUS_SERVER_ERROR).json({ error: err.message })
      })
  })
};
const getUserName = (req, res) => {
  const { username } = req.session;
  res.json(req.session.username);
};
const logout = (req, res) => {
  req.session.destroy();
  //req.session.username = undefined;
  res.json(req.session)
}
module.exports = {
  createUser,
  findUser,
  getUserName,
  logout
};