// Test Utilities and Helpers

const pool = require('./db');

/**
 * Clear all tables in test database
 */
const clearDatabase = async () => {
  const tables = ['comments', 'posts', 'users'];
  
  try {
    await pool.query('BEGIN');
    
    for (const table of tables) {
      await pool.query(`TRUNCATE ${table} CASCADE`);
    }
    
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Create test user
 */
const createTestUser = async (userData = {}) => {
  const { hashPassword, generateToken } = require('./auth');
  
  const defaultData = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPassword123!',
  };
  
  const user = { ...defaultData, ...userData };
  user.password = await hashPassword(user.password);
  
  const result = await pool.query(
    'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username',
    [user.email, user.username, user.password]
  );
  
  const token = generateToken(result.rows[0]);
  return { user: result.rows[0], token };
};

/**
 * Create test post
 */
const createTestPost = async (userId, postData = {}) => {
  const defaultData = {
    title: 'Test Post',
    content: 'This is a test post',
  };
  
  const post = { ...defaultData, ...postData };
  
  const result = await pool.query(
    'INSERT INTO posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING id, user_id, title, content, created_at',
    [userId, post.title, post.content]
  );
  
  return result.rows[0];
};

/**
 * Create test comment
 */
const createTestComment = async (postId, userId, commentData = {}) => {
  const defaultData = {
    content: 'Test comment',
  };
  
  const comment = { ...defaultData, ...commentData };
  
  const result = await pool.query(
    'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, post_id, user_id, content, created_at',
    [postId, userId, comment.content]
  );
  
  return result.rows[0];
};

/**
 * Setup test database
 */
const setupTestDatabase = async () => {
  await clearDatabase();
};

/**
 * Teardown test database
 */
const teardownTestDatabase = async () => {
  await clearDatabase();
  await pool.end();
};

/**
 * Mock GraphQL context
 */
const createMockContext = (user = null) => {
  const { generateToken } = require('./auth');
  
  let authHeader = '';
  if (user) {
    const token = generateToken(user);
    authHeader = `Bearer ${token}`;
  }
  
  return {
    authHeader,
    loaders: {},
  };
};

/**
 * Assert GraphQL error
 */
const assertGraphQLError = (response, expectedMessage) => {
  if (!response.errors || !response.errors.length) {
    throw new Error('Expected GraphQL error but got success response');
  }
  
  const errorMessage = response.errors[0].message;
  if (!errorMessage.includes(expectedMessage)) {
    throw new Error(`Expected error "${expectedMessage}" but got "${errorMessage}"`);
  }
};

module.exports = {
  clearDatabase,
  createTestUser,
  createTestPost,
  createTestComment,
  setupTestDatabase,
  teardownTestDatabase,
  createMockContext,
  assertGraphQLError,
};
