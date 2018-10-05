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
      throw 'sfd'
      setTimeout(() => {
        resolve('tursfd');
      }, 3000);
    });
  })
  .catch(err => {
    console.log('ERROR caught', err);
    return 'more chese';
  })
  .then(res => {
    return new Prom((resolve, reject) => {
      resolve('basic');
    });
  })
  .then(res => {
    return new Prom((resolve, reject) => {
      setTimeout(() => {
        resolve('last');
      }, 3000);
    });
  })
  .then(res => {
    return 3
  })
  .then(res => {
    console.log('mo', res);
    return 'now';
  })
  .catch(err => {
    console.log('final error caught', err);
  })
  .finally((val) => {
    console.log('finally block', val);
    return 'hello';
  })
  .then(res => {
    console.log('after finally', res);
  });

