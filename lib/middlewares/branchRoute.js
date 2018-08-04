const express = require('express');

const defaults = {
  keyNotFound: function (req, res) {
    return res.notfound();
  },

  handlerNotSet: function (req, res) {
    return res.notfound();
  }
};

module.exports = function (reducer, branchMap, opt = {}) {
  const options = Object.assign({}, defaults, opt);
  const routerMap = {};

  Object.keys(branchMap).forEach(key => {
    const router = express.Router({ mergeParams: true });

    if (options.before) {
      router.use(options.before);
    }

    router.use(branchMap[key]);

    if (options.after) {
      router.use(options.after);
    }

    routerMap[key] = router;
  });

  return function (req, res, next) {
    const key = reducer(req, res, next);
    // here for preprocessed response in reducer
    // but not recommended
    if (key === res) {
      return res.end();
    }
    
    // when no key (undefined) or null key returned from reducer,
    // use keyNotFound handler and exit;
    // but when key is just empty string, go through the process.
    if (key == null) {
      return options.keyNotFound(req, res, next);
    }

    if (!routerMap[key]) {
      return options.handlerNotSet(req, res, next);
    }

    return routerMap[key](req, res, next);
  };
};
