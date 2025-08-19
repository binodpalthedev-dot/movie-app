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
  // Set different maxAge based on remember me
  const maxAge = remember 
    ? 30 * 24 * 60 * 60 * 1000  // 30 days for remember me
    : 7 * 24 * 60 * 60 * 1000;  // 7 days normal (or use your default)

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge
  });

};

const clearTokenCookie = (res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, setTokenCookie, clearTokenCookie, verifyToken };