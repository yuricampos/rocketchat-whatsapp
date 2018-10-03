'use strict'


export function parseObject (obj) {
  for (var key in obj) {
    if (['0','1'].indexOf(obj[key]) !== -1) {
      obj[key] = +obj[key];

    } else if (obj[key].indexOf('{') !== -1) {
      obj[key] = JSON.parse(obj[key]);

    } else {
      obj[key] = obj[key];
    }
  }

  return obj;
};

export default {};
