INSERT INTO users (username, email, password_hash, role) VALUES
  ('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR57XO1e', 'admin'),
  ('user1', 'user1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR57XO1e', 'user'),
  ('user2', 'user2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR57XO1e', 'user'),
  ('user3', 'user3@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR57XO1e', 'user')
ON CONFLICT (username) DO NOTHING;

INSERT INTO posts (title, content, author_id, published) VALUES
  ('Getting Started with GraphQL', 'GraphQL is a query language for APIs.', 1, true),
  ('DataLoader Pattern Explained', 'The DataLoader pattern solves the N+1 query problem.', 2, true),
  ('JWT Authentication Best Practices', 'JSON Web Tokens are a popular authentication method.', 3, true),
  ('GraphQL Subscriptions in Action', 'Real-time updates with GraphQL subscriptions.', 1, true),
  ('Advanced Query Optimization', 'Performance tuning techniques for GraphQL APIs.', 2, false),
  ('Building Scalable APIs', 'Architecture patterns for building scalable APIs.', 3, true),
  ('Database Migration Strategies', 'Best practices for managing database migrations.', 1, true),
  ('Field-Level Authorization', 'Implementing fine-grained access control.', 2, true)
ON CONFLICT DO NOTHING;

INSERT INTO comments (content, author_id, post_id) VALUES
  ('Great introduction!', 2, 1),
  ('Thanks for explaining clearly.', 3, 1),
  ('Very helpful article.', 1, 2),
  ('Can you elaborate?', 3, 2),
  ('Excellent guide!', 1, 3),
  ('Will implement JWT.', 2, 3),
  ('Looking forward to more.', 3, 4),
  ('Real-time updates are crucial.', 1, 4),
  ('Exactly what I needed.', 2, 6),
  ('Very practical examples!', 3, 6),
  ('Architecture matters.', 1, 7),
  ('Great breakdown.', 2, 7),
  ('Important for security.', 3, 8),
  ('Excellent details!', 1, 8)
ON CONFLICT DO NOTHING;
