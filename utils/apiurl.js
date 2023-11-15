const path = require('path');

exports.APIUrl = (link) => {
  const urlProtocol = 'http://127.0.0.1:8080';
  if (link.startsWith('/')) {
    return `${urlProtocol}${link}`;
  }

  return `${urlProtocol}/${link}`;
};
