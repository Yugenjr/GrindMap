const WHITELIST = new Set([
  '127.0.0.1',
  '::1',
  'localhost'
]);

const BLACKLIST = new Set();

export const ipFilter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Always allow whitelisted IPs
  if (WHITELIST.has(ip)) {
    return next();
  }
  
  // Block blacklisted IPs
  if (BLACKLIST.has(ip)) {
    console.warn(`🚫 Blocked request from blacklisted IP: ${ip}`);
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Your IP has been blocked'
    });
  }
  
  next();
};

export const addToBlacklist = (ip, reason = 'Manual block') => {
  BLACKLIST.add(ip);
  console.log(`🚫 Added ${ip} to blacklist: ${reason}`);
};

export const removeFromBlacklist = (ip) => {
  BLACKLIST.delete(ip);
  console.log(`✅ Removed ${ip} from blacklist`);
};

export const addToWhitelist = (ip) => {
  WHITELIST.add(ip);
  console.log(`✅ Added ${ip} to whitelist`);
};

export const getBlacklist = () => Array.from(BLACKLIST);
export const getWhitelist = () => Array.from(WHITELIST);