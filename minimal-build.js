const { spawn } = require('child_process');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteSync('minimal-build.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  logStream.write(logMessage);
}

// Test basic command execution
log('Testing basic command execution...');
const testProcess = spawn('echo', ['Hello, World!']);

testProcess.stdout.on('data', (data) => {
  log(`Test output: ${data}`);
});

testProcess.stderr.on('data', (data) => {
  log(`Test error: ${data}`);
});

testProcess.on('close', (code) => {
  log(`Test process exited with code ${code}`);
  
  if (code === 0) {
    // If the test command worked, try the build
    log('Test command successful, attempting build...');
    const buildProcess = spawn('npx', ['electron-builder', '--win', '--debug'], {
      stdio: 'inherit',
      shell: true
    });
    
    buildProcess.on('close', (buildCode) => {
      log(`Build process exited with code ${buildCode}`);
      process.exit(buildCode);
    });
  } else {
    log('Test command failed, cannot proceed with build');
    process.exit(1);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  log('Process interrupted');
  process.exit(0);
});
