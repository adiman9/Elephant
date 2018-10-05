const Prom = require('./prom');
// const Prom = Promise;

function promTest() {
  return new Prom((resolve, reject) => {
    resolve('pass');
  });
}

promTest()
  .then(res => {
    return new Prom((resolve, reject) => {
      setTimeout(() => {
        resolve('more');
      }, 3000);
    });
  })
  .then(res => {
    return new Prom((resolve, reject) => {
      setTimeout(() => {
        throw 'sfd'
        // resolve('tursfd');
      }, 3000);
    });
  })
  .then(res => {
    return new Prom((resolve, reject) => {
      resolve('basic');
    });
  })
  .then(res => {
    return new Prom((resolve, reject) => {
      setTimeout(() => {
        reject('last');
      }, 3000);
    });
  })
  .then(res => {
    return 3
  })
  .then(res => {
    console.log('mo', res);
  })
  .catch(err => {
    console.log('ERROR caught', err);
  });
