/**
 * CORS Helper for Lambda Functions
 * Add this to all your Lambda function responses to ensure CORS headers are always present
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://d7t9x3j66yd8k.cloudfront.net',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

/**
 * Create a proper Lambda response with CORS headers
 * @param {number} statusCode - HTTP status code
 * @param {any} body - Response body (will be JSON.stringify'd)
 * @param {object} additionalHeaders - Additional headers to include
 * @returns {object} - Properly formatted Lambda response
 */
function createCorsResponse(statusCode, body, additionalHeaders = {}) {
  return {
    statusCode: statusCode,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      ...additionalHeaders
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

/**
 * Handle CORS preflight requests
 * Add this at the beginning of your Lambda function
 * @param {object} event - Lambda event object
 * @returns {object|null} - CORS preflight response or null if not a preflight request
 */
function handleCorsPreFlight(event) {
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(200, { message: 'CORS preflight successful' });
  }
  return null;
}

// Example usage in your Lambda functions:
/*
exports.handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreFlight(event);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Your actual Lambda logic here
    const result = await yourBusinessLogic(event);
    
    // Return success with CORS
    return createCorsResponse(200, {
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Lambda error:', error);
    
    // Return error with CORS
    return createCorsResponse(500, {
      success: false,
      error: error.message
    });
  }
};
*/

module.exports = {
  CORS_HEADERS,
  createCorsResponse,
  handleCorsPreFlight
};
