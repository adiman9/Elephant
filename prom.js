class Prom {
  constructor(fn) {
    this.fn = fn;
    this.value = null;
    this.state = 'initialised';
    this.isFinished = false;
    this.resolverFn = null;
    this.rejecterFn = null;
    try {
      fn(this._resolve.bind(this), this._reject.bind(this));
    } catch(e) {
      return new Prom((resolve, reject) => {
        reject(e);
      });
    }
  }
  _resolve(val) {
    this.isFinished = true;
    this.value = val;
    this.state = 'resolved';
    if (this.resolverFn) {
      this.resolverFn(val);
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
    }, 0)
  }
  then(thenFn) {
    if (this.isFinished && this.state === 'resolved') {
      try {
        const res = thenFn(this.value);
        if (res instanceof Prom) {
          return res;
        }
        return new Prom((resolve, reject) => {
          resolve(res);
        });
      } catch(e) {
        if (this.rejecterFn) {
          return this.rejecterFn(e);
        }
        return new Prom((resolve, reject) => {
          reject(e);
        });
      }
    }
    return new Prom((resolve, reject) => {
      if (!this.rejecterFn) {
        this.rejecterFn = (error) => {
          reject(error);
        }
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
    if (this.isFinished && this.state === 'rejected') {
      return catchFn(this.value);
    }
    this.rejecterFn = catchFn;
  }
}

module.exports = Prom;
