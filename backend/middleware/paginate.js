// backend/middleware/paginate.js

const MAX_LIMIT = 100;

const paginate = (defaultLimit = 10) => {
  return (req, res, next) => {
    // 1. Extract and sanitize query parameters
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = parseInt(req.query.limit, 10);
    // Hard cap the page size so a single request can never ask for the whole table.
    const limit = Math.min(
      requestedLimit > 0 ? requestedLimit : defaultLimit,
      MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const sort = req.query.sort || "desc";

    // 2. Attach the cleaned parameters to the request object
    req.pagination = {
      page,
      limit,
      skip,
      search,
      sort,
    };

    // 3. Attach a helper method to standardise the final JSON response
    res.sendPaginated = (data, totalCount) => {
      res.json({
        users: data, // Change this key dynamically in Step 2 if you want it to be perfectly generic
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    };

    next();
  };
};

module.exports = paginate;
