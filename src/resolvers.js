const pool = require('./db');
const pubsub = require('./pubsub');
const { verifyToken, getTokenFromHeader, generateToken, hashPassword } = require('./auth');

function encodeCursor(id) {
  return Buffer.from(`cursor_${id}`).toString('base64');
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return parseInt(decoded.replace('cursor_', ''), 10);
  } catch {
    return null;
  }
}

function getAuthUser(context) {
  const token = getTokenFromHeader(context.authHeader);
  if (!token) return null;
  return verifyToken(token);
}

function requireAuth(context) {
  const user = getAuthUser(context);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

async function buildConnection(query, queryParams, first, after, orderBy = 'id ASC') {
  const limit = Math.min(first || 10, 100);
  const afterId = decodeCursor(after);
  let whereClause = '';
  let params = [...queryParams];
  if (afterId) {
    const hasWhere = /\bwhere\b/i.test(query);
    whereClause = hasWhere ? ` AND id > $${params.length + 1}` : ` WHERE id > $${params.length + 1}`;
    params.push(afterId);
  }
  const finalQuery = `${query}${whereClause} ORDER BY ${orderBy} LIMIT ${limit + 1}`;
  const result = await pool.query(finalQuery, params);
  const rows = result.rows;
  const hasNextPage = rows.length > limit;
  const edges = rows.slice(0, limit).map((row) => ({
    cursor: encodeCursor(row.id),
    node: row,
  }));
  return {
    edges,
    pageInfo: {
      hasNextPage,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    },
  };
}

const resolvers = {
  Query: {
    async user(_parent, args, context) {
      const result = await pool.query(
        'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
        [args.id]
      );
      return result.rows[0] || null;
    },

    async users(_parent, args, context) {
      const query = 'SELECT id, username, email, role, created_at FROM users';
      return buildConnection(query, [], args.first, args.after);
    },

    async post(_parent, args, context) {
      const result = await pool.query(
        'SELECT id, title, content, author_id, published, created_at, updated_at FROM posts WHERE id = $1',
        [args.id]
      );
      return result.rows[0] || null;
    },

    async posts(_parent, args, context) {
      let query = 'SELECT id, title, content, author_id, published, created_at, updated_at FROM posts';
      let params = [];
      if (args.published !== undefined && args.published !== null) {
        query += ` WHERE published = $1`;
        params.push(args.published);
      }
      return buildConnection(query, params, args.first, args.after, 'id DESC');
    },

    async me(_parent, _args, context) {
      const user = getAuthUser(context);
      if (!user) {
        throw new Error('Authentication required');
      }
      const result = await pool.query(
        'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
        [user.sub]
      );
      return result.rows[0] || null;
    },
  },

  Mutation: {
    async createPost(_parent, args, context) {
      const user = requireAuth(context);
      const { title, content, published = false } = args.input;
      const result = await pool.query(
        `INSERT INTO posts (title, content, author_id, published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, title, content, author_id, published, created_at, updated_at`,
        [title, content, user.sub, published]
      );
      const post = result.rows[0];
      pubsub.publish('POST_CREATED', { postCreated: post });
      return post;
    },

    async updatePost(_parent, args, context) {
      const user = requireAuth(context);
      const { id } = args;
      const { title, content, published } = args.input;
      const postResult = await pool.query('SELECT author_id FROM posts WHERE id = $1', [id]);
      if (postResult.rows.length === 0) {
        throw new Error('Post not found');
      }
      const post = postResult.rows[0];
      if (post.author_id !== parseInt(user.sub) && user.role !== 'admin') {
        throw new Error('Not authorized to update this post');
      }
      const updates = [];
      const params = [];
      let paramCount = 1;
      if (title !== undefined) {
        updates.push(`title = $${paramCount}`);
        params.push(title);
        paramCount++;
      }
      if (content !== undefined) {
        updates.push(`content = $${paramCount}`);
        params.push(content);
        paramCount++;
      }
      if (published !== undefined) {
        updates.push(`published = $${paramCount}`);
        params.push(published);
        paramCount++;
      }
      updates.push(`updated_at = NOW()`);
      const query = `
        UPDATE posts
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, title, content, author_id, published, created_at, updated_at
      `;
      params.push(id);
      const updateResult = await pool.query(query, params);
      return updateResult.rows[0];
    },

    async deletePost(_parent, args, context) {
      const user = requireAuth(context);
      const { id } = args;
      const postResult = await pool.query('SELECT author_id FROM posts WHERE id = $1', [id]);
      if (postResult.rows.length === 0) {
        throw new Error('Post not found');
      }
      const post = postResult.rows[0];
      if (post.author_id !== parseInt(user.sub) && user.role !== 'admin') {
        throw new Error('Not authorized to delete this post');
      }
      await pool.query('DELETE FROM posts WHERE id = $1', [id]);
      return true;
    },

    async createComment(_parent, args, context) {
      const user = requireAuth(context);
      const { content, postId } = args.input;
      const postResult = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
      if (postResult.rows.length === 0) {
        throw new Error('Post not found');
      }
      const result = await pool.query(
        `INSERT INTO comments (content, author_id, post_id, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, content, author_id, post_id, created_at`,
        [content, user.sub, postId]
      );
      const comment = result.rows[0];
      pubsub.publish(`COMMENT_ADDED_${postId}`, { commentAdded: comment });
      return comment;
    },
  },

  User: {
    async posts(parent, args, context) {
      const result = await pool.query(
        `SELECT id, title, content, author_id, published, created_at, updated_at
         FROM posts WHERE author_id = $1 ORDER BY created_at DESC`,
        [parent.id]
      );
      return result.rows;
    },

    email(parent, args, context) {
      const user = getAuthUser(context);
      if (user && parseInt(user.sub) === parent.id) {
        return parent.email;
      }
      if (user && user.role === 'admin') {
        return parent.email;
      }
      throw new Error('Not authorized to access email');
    },
  },

  Post: {
    async author(parent, args, context) {
      return context.loaders.userLoader.load(parent.author_id);
    },

    async comments(parent, args, context) {
      const first = Math.min(args.first || 10, 100);
      const after = args.after;
      const allComments = await context.loaders.commentsByPostLoader.load(parent.id);
      const afterId = decodeCursor(after);
      let filteredComments = allComments;
      if (afterId) {
        const afterIndex = allComments.findIndex((c) => c.id === afterId);
        if (afterIndex >= 0) {
          filteredComments = allComments.slice(afterIndex + 1);
        }
      }
      const edges = filteredComments.slice(0, first).map((comment) => ({
        cursor: encodeCursor(comment.id),
        node: comment,
      }));
      const hasNextPage = filteredComments.length > first;
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
      };
    },
  },

  Comment: {
    async author(parent, args, context) {
      return context.loaders.commentAuthorLoader.load(parent.author_id);
    },

    async post(parent, args, context) {
      const result = await pool.query(
        'SELECT id, title, content, author_id, published, created_at, updated_at FROM posts WHERE id = $1',
        [parent.post_id]
      );
      return result.rows[0];
    },
  },
};

module.exports = resolvers;
