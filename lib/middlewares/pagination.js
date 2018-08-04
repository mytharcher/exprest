function paged({ count, rows }) {
	const maxPage = Math.ceil(count / this.locals.paginator.size) || 1;
	const page = Math.min(maxPage, this.locals.paginator.page);

	return this.data({
		page,
		count,
		rows
	});
}

module.exports = function ({ from = 'query', pageKey = 'page', sizeKey = 'size' }) {
	return function (req, res, next) {
		const source = req[from] || {};
		const page = source[pageKey];
		const size = source[sizeKey];
		if (!page && !size) {
			return next(null, req, res);
		}

		const page = parseInt(page, 10) || 1;
		const size = parseInt(size, 10) || 10;

		req.meta.paginator = {
			offset: (page - 1) * size,
			limit: size,
		};

		res.locals.paginator = { page, size };

		res.paged = paged;

		next(null, req, res);
	}
};
