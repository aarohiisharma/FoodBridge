const healthService = require('../services/healthService');

function getHealth(request, response) {
  response.status(200).json(healthService.getStatus());
}

module.exports = { getHealth };
