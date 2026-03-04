/**
 * Security Scanner - Node.js Version
 * Cross-platform security checking for Windows/Linux/Mac
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStatus(success, message) {
  log(success ? `✓ ${message}` : `✗ ${message}`, success ? 'green' : 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function runCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

async function checkNpmAudit() {
  log('\n1. Checking npm audit...', 'blue');
  log('-------------------------');

  const result = await runCommand('npm audit --production --json');
  
  if (result.success || result.stdout) {
    try {
      const auditData = JSON.parse(result.stdout || '{}');
      const { vulnerabilities = {} } = auditData.metadata || {};

      if (vulnerabilities.total === 0) {
        logStatus(true, 'No vulnerabilities found');
        return { critical: 0, high: 0, moderate: 0, low: 0 };
      } else {
        logWarning(`Found ${vulnerabilities.total} vulnerabilities`);
        log(`  Critical: ${vulnerabilities.critical || 0}`);
        log(`  High: ${vulnerabilities.high || 0}`);
        log(`  Moderate: ${vulnerabilities.moderate || 0}`);
        log(`  Low: ${vulnerabilities.low || 0}`);
        return vulnerabilities;
      }
    } catch (error) {
      logWarning('Could not parse audit results');
      return null;
    }
  } else {
    logWarning('npm audit failed to run');
    return null;
  }
}

async function checkOutdatedPackages() {
  log('\n2. Checking for outdated packages...', 'blue');
  log('------------------------------------');

  const result = await runCommand('npm outdated --json');
  
  try {
    const outdated = JSON.parse(result.stdout || '{}');
    const outdatedCount = Object.keys(outdated).length;

    if (outdatedCount === 0) {
      logStatus(true, 'All packages up to date');
    } else {
      logWarning(`${outdatedCount} packages are outdated`);
      Object.entries(outdated).forEach(([pkg, info]) => {
        if (info.current !== info.latest) {
          log(`  ${pkg}: ${info.current} → ${info.latest}`);
        }
      });
    }

    return outdatedCount;
  } catch (error) {
    logStatus(true, 'All packages appear up to date');
    return 0;
  }
}

async function checkForSecrets() {
  log('\n3. Checking for sensitive data in code...', 'blue');
  log('-----------------------------------------');

  let secretsFound = 0;
  const patterns = [
    { name: 'API Keys', regex: /api[_-]?key\s*=\s*['"][^'"]{20,}['"]/gi },
    { name: 'Passwords', regex: /password\s*=\s*['"][^'"]+['"]/gi },
    { name: 'Tokens', regex: /token\s*=\s*['"][^'"]{20,}['"]/gi },
    { name: 'Private Keys', regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi },
    { name: 'AWS Keys', regex: /AKIA[0-9A-Z]{16}/gi },
  ];

  async function scanDirectory(dir) {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(dir, file.name);

      // Skip node_modules and other directories
      if (file.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(file.name)) {
          await scanDirectory(filePath);
        }
        continue;
      }

      // Only scan .js, .ts, .env files
      if (!/\.(js|ts|env)$/.test(file.name)) continue;

      try {
        const content = await fs.readFile(filePath, 'utf-8');

        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches && !content.includes('process.env')) {
            logWarning(`Potential ${pattern.name} in ${filePath}`);
            secretsFound++;
            break;
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  await scanDirectory('./src');

  if (secretsFound === 0) {
    logStatus(true, 'No hardcoded secrets detected');
  } else {
    logWarning(`Found ${secretsFound} potential secret(s)`);
  }

  return secretsFound;
}

async function checkEnvironmentConfig() {
  log('\n4. Checking environment configuration...', 'blue');
  log('----------------------------------------');

  try {
    await fs.access('.env.example');
    logStatus(true, '.env.example exists');
  } catch {
    logWarning('.env.example not found');
  }

  try {
    await fs.access('.env');
    logWarning('.env file exists (ensure it\'s in .gitignore)');

    // Check .gitignore
    try {
      const gitignore = await fs.readFile('.gitignore', 'utf-8');
      if (gitignore.includes('.env')) {
        logStatus(true, '.env is properly gitignored');
      } else {
        logWarning('.env is NOT gitignored - SECURITY RISK!');
      }
    } catch {
      logWarning('No .gitignore found');
    }
  } catch {
    // .env doesn't exist - that's okay
  }
}

async function checkSecurityMiddleware() {
  log('\n5. Security middleware check...', 'blue');
  log('----------------------------');

  const middlewareFiles = [
    'src/middlewares/security.headers.middleware.js',
    'src/middlewares/sanitization.middleware.js',
    'src/middlewares/security.middleware.js',
  ];

  for (const file of middlewareFiles) {
    try {
      await fs.access(file);
      logStatus(true, `${path.basename(file)} found`);
    } catch {
      logWarning(`${path.basename(file)} missing`);
    }
  }
}

async function generateReport(auditResults, secretsCount) {
  log('\n======================================'  , 'blue');
  log('Security Audit Complete', 'blue');
  log('======================================', 'blue');

  log('\nSummary:', 'blue');
  log('--------');

  if (auditResults) {
    log(`Critical Vulnerabilities: ${auditResults.critical || 0}`, 
        auditResults.critical ? 'red' : 'green');
    log(`High Vulnerabilities: ${auditResults.high || 0}`, 
        auditResults.high ? 'yellow' : 'green');
    log(`Moderate Vulnerabilities: ${auditResults.moderate || 0}`);
    log(`Low Vulnerabilities: ${auditResults.low || 0}`);
  }

  log(`Secrets Check: ${secretsCount === 0 ? 'PASS' : 'FAIL'}`, 
      secretsCount === 0 ? 'green' : 'red');

  const hasCriticalIssues = auditResults && auditResults.critical > 0;
  const hasSecrets = secretsCount > 0;

  if (hasCriticalIssues || hasSecrets) {
    log('\n' + '='.repeat(50), 'red');
    if (hasCriticalIssues) {
      log('CRITICAL: Cannot proceed with critical vulnerabilities', 'red');
    }
    if (hasSecrets) {
      log('WARNING: Potential secrets found in code', 'red');
    }
    log('='.repeat(50), 'red');
    return false;
  } else {
    log('\n✓ Security audit passed', 'green');
    return true;
  }
}

async function main() {
  log('🔒 Running GrindMap Security Audit...', 'blue');
  log('======================================', 'blue');

  const auditResults = await checkNpmAudit();
  await checkOutdatedPackages();
  const secretsCount = await checkForSecrets();
  await checkEnvironmentConfig();
  await checkSecurityMiddleware();

  const passed = await generateReport(auditResults, secretsCount);

  process.exit(passed ? 0 : 1);
}

main().catch((error) => {
  log(`\nError running security audit: ${error.message}`, 'red');
  process.exit(1);
});
