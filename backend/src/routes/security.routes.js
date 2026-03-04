import express from 'express';
import { addToBlacklist, removeFromBlacklist, addToWhitelist, getBlacklist, getWhitelist } from '../utils/ipManager.js';

const router = express.Router();

// Get blacklisted IPs
router.get('/blacklist', (req, res) => {
  res.json({
    success: true,
    blacklist: getBlacklist()
  });
});

// Get whitelisted IPs
router.get('/whitelist', (req, res) => {
  res.json({
    success: true,
    whitelist: getWhitelist()
  });
});

// Add IP to blacklist
router.post('/blacklist', (req, res) => {
  const { ip, reason } = req.body;
  
  if (!ip) {
    return res.status(400).json({
      success: false,
      error: 'IP address required'
    });
  }
  
  addToBlacklist(ip, reason);
  res.json({
    success: true,
    message: `IP ${ip} added to blacklist`
  });
});

// Remove IP from blacklist
router.delete('/blacklist/:ip', (req, res) => {
  const { ip } = req.params;
  removeFromBlacklist(ip);
  res.json({
    success: true,
    message: `IP ${ip} removed from blacklist`
  });
});

// Add IP to whitelist
router.post('/whitelist', (req, res) => {
  const { ip } = req.body;
  
  if (!ip) {
    return res.status(400).json({
      success: false,
      error: 'IP address required'
    });
  }
  
  addToWhitelist(ip);
  res.json({
    success: true,
    message: `IP ${ip} added to whitelist`
  });
});

export default router;