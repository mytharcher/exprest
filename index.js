const express = require('express');

const ModelService = require('./lib/ModelService');
const branchRoute = require('./lib/middlewares/branchRoute');
const meta = require('./lib/middlewares/meta');
const pagination = require('./lib/middlewares/pagination');
const response = require('./lib/middlewares/response');
const validation = require('./lib/middlewares/validation');



module.exports = {
	ModelService,
	branchRoute,
	meta,
	pagination,
	response,
	validation,
	app() {
		const app = express();
		app.use(meta);
		app.use(response);
		return app;
	}
};
