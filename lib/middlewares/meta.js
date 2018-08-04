// Adding meta payload to each request
module.exports = function (req, res, next) {
	req.meta = req.meta || {};
	
	next();
};
