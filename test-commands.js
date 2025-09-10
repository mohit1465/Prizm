const { exec } = require('child_process');

console.log('Testing command execution...');

// Test basic command
exec('echo Hello World', (error, stdout, stderr) => {
  console.log('=== Test 1: echo command ===');
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
  console.log('error:', error);
  console.log('===========================\n');
});

// Test node version
exec('node --version', (error, stdout, stderr) => {
  console.log('=== Test 2: node version ===');
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
  console.log('error:', error);
  console.log('===========================\n');
});

// Test npm version
exec('npm --version', (error, stdout, stderr) => {
  console.log('=== Test 3: npm version ===');
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
  console.log('error:', error);
  console.log('==========================');
});
