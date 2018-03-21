const User = require('../userController');
const Video = require('../videoControllers');
const Profile = require('../profPicController');
const bcrypt = require('bcrypt');
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;
const BCRYPT_COST = 11;

const hashedPassword = (req, res, next) => {
  const {password} = req.body;
  if (!password) {
    res.status(STATUS_USER_ERROR).json({error: 'Please enter a password'})
    return
  }
  bcrypt
    .hash(password, BCRYPT_COST)
    .then(hashed_pw => {
      req.password = hashed_pw;
      next();
    })
    .catch(err => {
      throw new Error(err);
    });
};

module.exports = {
  hashedPassword
}