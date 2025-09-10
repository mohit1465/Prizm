const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a log file
const logFile = path.join(__dirname, 'build-debug.log');
const logStream = fs.createWriteStream(logFile);

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  logStream.write(logMessage);
}

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command}`);
    const child = exec(command, {
      ...options,
      cwd: options.cwd || __dirname,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }, (error, stdout, stderr) => {
      if (stdout) log(`STDOUT: ${stdout}`);
      if (stderr) log(`STDERR: ${stderr}`);
      
      if (error) {
        log(`Command failed: ${error.message}`);
        reject(error);
      } else {
        log('Command completed successfully');
        resolve({ stdout, stderr });
      }
    });

    child.stdout?.on('data', data => log(`STDOUT: ${data}`));
    child.stderr?.on('data', data => log(`STDERR: ${data}`));
  });
}

async function main() {
  try {
    log('Starting build process...');
    
    // Check Node.js and npm versions
    await runCommand('node --version');
    await runCommand('npm --version');
    
    // Clean previous builds
    log('Cleaning previous builds...');
    if (fs.existsSync(path.join(__dirname, 'dist'))) {
      await runCommand('rmdir /s /q dist');
    }
    
    // Install dependencies
    log('Installing dependencies...');
    await runCommand('npm install');
    
    // Build the app
    log('Building application...');
    await runCommand('npx electron-builder --win --x64 --debug');
    
    log('Build completed successfully!');
  } catch (error) {
    log(`Build failed: ${error.message}`);
    process.exit(1);
  } finally {
    logStream.end();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Build process interrupted');
  process.exit(0);
});

main();
