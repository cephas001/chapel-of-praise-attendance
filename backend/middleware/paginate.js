// backend/middleware/paginate.js

const paginate = (defaultLimit = 10) => {
  return (req, res, next) => {
    // 1. Extract and sanitize query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || defaultLimit;
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
