const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a log file
const logFile = path.join(__dirname, 'build-output.log');
const logStream = fs.createWriteStream(logFile);

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  logStream.write(logMessage);
}

// Create a simple test file to verify file system access
const testFile = path.join(__dirname, 'test-write.txt');
fs.writeFileSync(testFile, 'Test write operation', 'utf8');
log(`Test file created at: ${testFile}`);

// Try a simple build with minimal configuration
log('Starting build process...');
const buildProcess = exec('npx electron-builder --win --debug', {
  cwd: __dirname,
  maxBuffer: 1024 * 1024 * 10 // 10MB buffer
});

buildProcess.stdout.on('data', (data) => {
  log(`STDOUT: ${data}`);
});

buildProcess.stderr.on('data', (data) => {
  log(`STDERR: ${data}`);
});

buildProcess.on('close', (code) => {
  log(`Build process exited with code ${code}`);
  logStream.end();
  
  // Read and display the end of the log file
  const logContent = fs.readFileSync(logFile, 'utf8');
  console.log('\n=== Build Log Summary ===');
  console.log(logContent.split('\n').slice(-20).join('\n'));
  console.log('=========================');
  console.log(`Full build log available at: ${logFile}`);
});

// Handle process termination
process.on('SIGINT', () => {
  log('Build process interrupted');
  process.exit(0);
});
