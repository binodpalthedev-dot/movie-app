// server/utils/jwt.js
const jwt = require('jsonwebtoken');

const generateToken = (id, expiresIn) => {
  // If expiresIn not provided, use default from env or 7d
  const expiry = expiresIn || process.env.JWT_EXPIRE || '7d';
  
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expiry
  });
};

const setTokenCookie = (res, token, remember = false) => {
  const maxAge = remember 
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: true,
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge,
    path: '/'
  });
};

const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: true,
    sameSite: isProduction ? 'None' : 'Lax',
    expires: new Date(0),
    path: '/'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, setTokenCookie, clearTokenCookie, verifyToken };