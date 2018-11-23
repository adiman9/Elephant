// Refer to: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

class Elephant {
  constructor(fn) {
    this.value = null;
    this.state = 'pending';
    this.isFinished = false;
    this.resolverFn = null;
    this.rejecterFn = null;
    this.finallyFn = null;
    try {
      fn(this._resolve.bind(this), this._reject.bind(this));
    } catch(e) {
      return Elephant.reject(e);
    }
  }
  static reject(err) {
    return new Elephant((resolve, reject) => {
      reject(err);
    });
  }
  static resolve(val) {
    return new Elephant((resolve, reject) => {
      resolve(val);
    });
  }
  static all(iter) {
    const len = iter.length;
    const resultArr = [];
    let returnedCount = 0;
    return new Elephant((resolve, reject) => {
      iter.forEach((item, i) => {
        item
          .then(res => {
            returnedCount++;
            resultArr[i] = res;
            if (returnedCount === len) {
              resolve(resultArr);
            }
          })
          .catch(res => reject(res))
      });
    });
  }
  static race(iter) {
    return new Elephant((resolve, reject) => {
      iter.forEach((item) => {
        item
          .then(res => resolve(res))
          .catch(res => reject(res))
      });
    });
  }
  _resolve(val) {
    this.isFinished = true;
    this.value = val;
    this.state = 'fulfilled';
    if (this.resolverFn) {
      this.resolverFn(val);
    } 
    if (this.finallyFn) {
      this.finallyFn(val);
    }
  }
  _reject(val) {
    this.isFinished = true;
    this.value = val;
    this.state = 'rejected';
    setTimeout(() => {
      if (this.rejecterFn) {
        this.rejecterFn(val);
      }
      if (this.finallyFn) {
        this.finallyFn(val);
      }
    }, 0)
  }
  _checkImmediateSettlement(state, handlerFn) {
    if (this.isFinished && this.state === state) {
      try {
        const res = handlerFn(this.value);
        if (res instanceof Elephant) {
          return res;
        }
        return Elephant.resolve(res);
      } catch(e) {
        return Elephant.reject(e);
      }
    }
  }
  then(thenFn, catchFn) {
    if (!thenFn) {
      return new Elephant((resolve, reject) => {
        this.resolverFn = (val) => resolve(val);
        this.rejecterFn = (err) => reject(err);
      });
    }
    const earlySettle = this._checkImmediateSettlement('fulfilled', thenFn);

    if (earlySettle) {
      return earlySettle;
    }

    if (catchFn) {
      const earlyReject = this._checkImmediateSettlement('rejected', catchFn);

      if (earlyReject) {
        return earlyReject;
      }
    }

    return new Elephant((resolve, reject) => {
      if (!this.rejecterFn) {
        this.rejecterFn = (error) => {
          if (catchFn) {
            try {
              const res = catchFn(error);
              if (res instanceof Elephant) {
                return res
                  .then(val => resolve(val))
                  .catch(err => reject(err));
              }
              return resolve(res);
            } catch(e) {
              return reject(e);
            }
          }
          return reject(error);
        }
        this._checkImmediateSettlement('rejected', this.rejecterFn);
      }
      this.resolverFn = (value) => {
        try {
          const res = thenFn(value);
          if (res instanceof Elephant) {
            return res
              .then(val => resolve(val))
              .catch(err => reject(err));
          }
          resolve(res);
        } catch(e) {
          reject(e);
        }
      }
    });
  }
  catch(catchFn) {
    const earlySettle = this._checkImmediateSettlement('rejected', catchFn);

    if (earlySettle) {
      return earlySettle;
    }

    return new Elephant((resolve, reject) => {
      if (!this.resolverFn) {
        this.resolverFn = (value) => {
          resolve(value);
        }
        this._checkImmediateSettlement('fulfilled', this.resolverFn);
      }
      this.rejecterFn = (error) => {
        try {
          const res = catchFn(error);
          if (res instanceof Elephant) {
            return res
              .then(val => resolve(val))
              .catch(err => reject(err));
          }
          resolve(res);
        } catch(e) {
          reject(e);
        }
      }
    });
  }
  finally(finallyFn) {
    if (this.isFinished) {
      try {
        finallyFn();
        return Elephant.resolve(this.value);
      } catch(e) {
        return Elephant.reject(e);
      }
    }
    return new Elephant((resolve, reject) => {
      this.finallyFn = (value) => {
        try {
          finallyFn();
          resolve(value);
        } catch(e) {
          reject(e);
        }
      }
    });
  }
}

module.exports = Elephant;
