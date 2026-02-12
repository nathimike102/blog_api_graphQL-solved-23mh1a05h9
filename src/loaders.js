const DataLoader = require('dataloader');
const pool = require('./db');

function createUserLoader() {
  return new DataLoader(async (userIds) => {
    const uniqueIds = [...new Set(userIds)];
    const query = `SELECT id, username, email, role, created_at FROM users WHERE id = ANY($1) ORDER BY id`;
    const result = await pool.query(query, [uniqueIds]);
    const userMap = new Map(result.rows.map((user) => [user.id, user]));
    return userIds.map((id) => userMap.get(id) || null);
  });
}

function createCommentsByPostLoader() {
  return new DataLoader(async (postIds) => {
    const uniqueIds = [...new Set(postIds)];
    const query = `SELECT id, content, author_id, post_id, created_at FROM comments WHERE post_id = ANY($1) ORDER BY post_id, created_at DESC`;
    const result = await pool.query(query, [uniqueIds]);
    const commentsByPost = new Map();
    uniqueIds.forEach((id) => commentsByPost.set(id, []));
    result.rows.forEach((comment) => {
      const comments = commentsByPost.get(comment.post_id) || [];
      comments.push(comment);
      commentsByPost.set(comment.post_id, comments);
    });
    return postIds.map((id) => commentsByPost.get(id) || []);
  });
}

function createCommentAuthorLoader() {
  return new DataLoader(async (authorIds) => {
    const uniqueIds = [...new Set(authorIds)];
    const query = `SELECT id, username, email, role, created_at FROM users WHERE id = ANY($1) ORDER BY id`;
    const result = await pool.query(query, [uniqueIds]);
    const userMap = new Map(result.rows.map((user) => [user.id, user]));
    return authorIds.map((id) => userMap.get(id) || null);
  });
}

function createLoaders() {
  return {
    userLoader: createUserLoader(),
    commentsByPostLoader: createCommentsByPostLoader(),
    commentAuthorLoader: createCommentAuthorLoader(),
  };
}

module.exports = { createLoaders, createUserLoader, createCommentsByPostLoader, createCommentAuthorLoader };
