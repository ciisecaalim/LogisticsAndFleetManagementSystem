const getDeletedByValue = (req) => {
  if (!req) {
    return 'system';
  }

  const headerValue = req.headers?.['x-deleted-by'] || req.headers?.['x-user'] || req.headers?.['x-username'];
  const bodyValue = req.body?.deletedBy;

  if (headerValue && String(headerValue).trim()) {
    return String(headerValue).trim();
  }

  if (bodyValue && String(bodyValue).trim()) {
    return String(bodyValue).trim();
  }

  return 'system';
};

module.exports = { getDeletedByValue };
