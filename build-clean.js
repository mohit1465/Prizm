const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a log file
const logFile = fs.createWriteStream('build.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  logFile.write(logMessage);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { 
      cwd: cwd || process.cwd(),
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      const str = data.toString();
      log(`stdout: ${str}`);
      output += str;
    });

    proc.stderr.on('data', (data) => {
      const str = data.toString();
      log(`stderr: ${str}`);
      output += str;
    });

    proc.on('close', (code) => {
      if (code === 0) {
        log(`Command succeeded with code ${code}`);
        resolve(output);
      } else {
        log(`Command failed with code ${code}`);
        reject(new Error(`Command failed with code ${code}: ${output}`));
      }
    });
  });
}

async function main() {
  try {
    log('Starting build process...');
    
    // Clean previous builds
    if (fs.existsSync('dist')) {
      log('Cleaning previous build...');
      await runCommand('rmdir', ['/s', '/q', 'dist'], process.cwd());
    }

    // Install dependencies
    log('Installing dependencies...');
    await runCommand('npm', ['install'], process.cwd());

    // Build the app
    log('Building application...');
    await runCommand('npx', ['electron-builder', '--win', '--x64'], process.cwd());

    log('Build completed successfully!');
  } catch (error) {
    log(`Build failed: ${error.message}`);
    process.exit(1);
  } finally {
    logFile.end();
  }
}

main();
