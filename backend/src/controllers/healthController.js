const healthService = require('../services/healthService');

async function getHealth(request, response, next) {
  try {
    response.status(200).json(await healthService.getStatus());
  } catch (error) {
    next(error);
  }
}

module.exports = { getHealth };
