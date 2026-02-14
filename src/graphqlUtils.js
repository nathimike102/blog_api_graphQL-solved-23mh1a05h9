// GraphQL Utilities and Helpers

const { GraphQLError } = require('graphql');
const logger = require('./logger')('graphqlUtils');

/**
 * Create GraphQL error with context
 */
const createGraphQLError = (message, code, statusCode = 400, extensions = {}) => {
  return new GraphQLError(message, {
    code,
    statusCode,
    extensions: {
      code,
      statusCode,
      ...extensions,
    },
  });
};

/**
 * Extract query complexity
 */
const getQueryComplexity = (selectionSet, depth = 0, maxDepth = 10) => {
  if (!selectionSet) return 0;
  if (depth > maxDepth) return Infinity;
  
  let complexity = 0;
  
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      complexity += 1;
      if (selection.selectionSet) {
        complexity += getQueryComplexity(selection.selectionSet, depth + 1, maxDepth);
      }
    } else if (selection.kind === 'InlineFragment') {
      complexity += getQueryComplexity(selection.selectionSet, depth, maxDepth);
    }
  }
  
  return complexity;
};

/**
 * Validate query complexity
 */
const validateQueryComplexity = (queryAST, maxComplexity = 100) => {
  const complexity = getQueryComplexity(queryAST.definitions[0].selectionSet);
  
  if (complexity > maxComplexity) {
    throw createGraphQLError(
      `Query too complex: ${complexity} > ${maxComplexity}`,
      'QUERY_TOO_COMPLEX',
      400
    );
  }
  
  return complexity;
};

/**
 * Format GraphQL error response
 */
const formatErrorResponse = (error) => {
  const formattedError = {
    message: error.message,
    code: error.extensions?.code || 'INTERNAL_ERROR',
    statusCode: error.extensions?.statusCode || 500,
  };
  
  if (error.locations) {
    formattedError.locations = error.locations;
  }
  
  if (error.path) {
    formattedError.path = error.path;
  }
  
  return formattedError;
};

/**
 * Log GraphQL operation
 */
const logGraphQLOperation = (operationName, variables, duration) => {
  logger.info('GraphQL Operation', {
    operation: operationName,
    variables: sanitizeVariables(variables),
    duration: `${duration.toFixed(2)}ms`,
  });
};

/**
 * Sanitize variables for logging (removes sensitive data)
 */
const sanitizeVariables = (variables) => {
  if (!variables) return variables;
  
  const sanitized = { ...variables };
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      sanitized[key] = '***REDACTED***';
    }
  }
  
  return sanitized;
};

/**
 * Merge schema patches
 */
const mergeSchemas = (...schemas) => {
  return schemas.join('\n\n');
};

/**
 * Resolve field metadata
 */
const resolveFieldMetadata = (field) => {
  return {
    name: field.name,
    type: field.type.toString(),
    isRequired: field.type.toString().endsWith('!'),
    isList: field.type.toString().includes('['),
    description: field.description,
  };
};

/**
 * Get resolver execution time
 */
const withTiming = (fn) => {
  return async (...args) => {
    const startTime = process.hrtime.bigint();
    const result = await fn(...args);
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000;
    
    return { result, duration: durationMs };
  };
};

/**
 * Create field resolver wrapper
 */
const wrapResolver = (resolver, options = {}) => {
  const { logging = true, errorHandler = null } = options;
  
  return async (parent, args, context, info) => {
    const startTime = Date.now();
    
    try {
      const result = await resolver(parent, args, context, info);
      
      if (logging) {
        const duration = Date.now() - startTime;
        logGraphQLOperation(info.fieldName, args, duration);
      }
      
      return result;
    } catch (error) {
      if (errorHandler) {
        return errorHandler(error);
      }
      throw error;
    }
  };
};

module.exports = {
  createGraphQLError,
  getQueryComplexity,
  validateQueryComplexity,
  formatErrorResponse,
  logGraphQLOperation,
  sanitizeVariables,
  mergeSchemas,
  resolveFieldMetadata,
  withTiming,
  wrapResolver,
};
