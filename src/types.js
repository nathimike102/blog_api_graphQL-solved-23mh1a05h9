/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} email - User email
 * @property {string} username - Username
 * @property {string} password - Hashed password
 * @property {Date} createdAt - Account creation timestamp
 */

/**
 * @typedef {Object} Post
 * @property {number} id - Post ID
 * @property {number} userId - Author ID
 * @property {string} title - Post title
 * @property {string} content - Post content
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Comment
 * @property {number} id - Comment ID
 * @property {number} postId - Parent post ID
 * @property {number} userId - Author ID
 * @property {string} content - Comment content
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} AuthToken
 * @property {string} token - JWT token
 * @property {number} expiresIn - Expiration time in seconds
 * @property {string} type - Token type (Bearer)
 */

/**
 * @typedef {Object} PageInfo
 * @property {string} endCursor - Last cursor in current page
 * @property {string} startCursor - First cursor in current page
 * @property {boolean} hasNextPage - Whether more pages exist
 * @property {boolean} hasPreviousPage - Whether previous pages exist
 */

/**
 * @typedef {Object} Edge
 * @property {*} node - Entity data
 * @property {string} cursor - Position cursor
 */

/**
 * @typedef {Object} Connection
 * @property {Edge[]} edges - Array of edges
 * @property {PageInfo} pageInfo - Pagination info
 * @property {number} totalCount - Total items count
 */

/**
 * @typedef {Object} GraphQLContext
 * @property {string} authHeader - Authorization header
 * @property {User|null} user - Authenticated user
 * @property {*} loaders - DataLoader instances
 */

/**
 * @typedef {Object} QueryArgs
 * @property {number} id - Item ID
 * @property {number} first - First N items
 * @property {string} after - Cursor for pagination
 */

/**
 * @typedef {Object} PaginationArgs
 * @property {number} first - First N items
 * @property {string} after - Cursor for pagination
 * @property {string} orderBy - Order field
 */

/**
 * @typedef {Object} ErrorDetail
 * @property {string} field - Field with error
 * @property {string} message - Error message
 * @property {string} code - Error code
 */

module.exports = {};
