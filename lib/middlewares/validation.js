const express = require('express');
const validate = require('express-validation');

function handleError(err, req, res, next) {
	if (err) {
		return res.invalid(err);
	}

	next();
}

module.exports = function(schema, errorHandler = handleError) {
	const middleware = express.Router();

	middleware.use(validate(schema), errorHandler);

	return middleware;
};
