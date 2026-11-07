/* ===================================================
   VERCEL SERVERLESS FUNCTION HANDLER
   Routes /api/* requests to server.js handleRequest
   Built for Node 22.x with native node:sqlite support
=================================================== */

const handleRequest = require('../server.js');

module.exports = async (req, res) => {
  return handleRequest(req, res);
};
