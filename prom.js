// TODO then should take 2 callbacks, one to fulfill and the other to reject
//
// TODO add resolve, reject, race and all static methods
//
// Refer to: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

class Prom {
  constructor(fn) {
    this.fn = fn;
    this.value = null;
    this.state = 'pending';
    this.isFinished = false;
    this.resolverFn = null;
    this.rejecterFn = null;
    this.finallyFn = null;
    try {
      fn(this._resolve.bind(this), this._reject.bind(this));
    } catch(e) {
      return new Prom((resolve, reject) => {
        reject(e);
      });
    }
  }
  static reject(err) {
    return new Prom((resolve, reject) => {
      reject(err);
    });
  }
  static resolve(val) {
    return new Prom((resolve, reject) => {
      resolve(val);
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
        if (res instanceof Prom) {
          return res;
        }
        return new Prom((resolve, reject) => {
          resolve(res);
        });
      } catch(e) {
        return new Prom((resolve, reject) => {
          reject(e);
        });
      }
    }
  }
  then(thenFn, catchFn) {
    const earlySettle = this._checkImmediateSettlement('fulfilled', thenFn);

    if (earlySettle) {
      return earlySettle;
    }

    return new Prom((resolve, reject) => {
      if (!this.rejecterFn) {
        this.rejecterFn = (error) => {
          reject(error);
        }
        this._checkImmediateSettlement('rejected', this.rejecterFn);
      }
      this.resolverFn = (value) => {
        try {
          const res = thenFn(value);
          if (res instanceof Prom) {
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

    return new Prom((resolve, reject) => {
      if (!this.resolverFn) {
        this.resolverFn = (value) => {
          resolve(value);
        }
        this._checkImmediateSettlement('fulfilled', this.resolverFn);
      }
      this.rejecterFn = (error) => {
        try {
          const res = catchFn(error);
          if (res instanceof Prom) {
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
        return new Prom((resolve, reject) => {
          resolve(this.value);
        });
      } catch(e) {
        return new Prom((resolve, reject) => {
          reject(e);
        });
      }
    }
    return new Prom((resolve, reject) => {
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

module.exports = Prom;
