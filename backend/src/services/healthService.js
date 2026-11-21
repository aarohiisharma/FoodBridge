function getStatus() {
  return {
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getStatus };
