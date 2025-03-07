const readline = require('readline');
const { spawn } = require('child_process');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🎬 Movie Chatbot Launcher 🎬\n');
console.log('Choose which AI backend to use:');
console.log('1. Hugging Face API (Cloud-based, no setup required)');
console.log('2. Ollama (Local LLM, requires Ollama to be installed and running)');

rl.question('\nEnter your choice (1 or 2): ', (choice) => {
  let command;
  
  if (choice === '1') {
    console.log('\nStarting with Hugging Face API...\n');
    command = 'npm run dev-all';
  } else if (choice === '2') {
    console.log('\nStarting with Ollama local LLM...');
    console.log('Make sure Ollama is installed and running!\n');
    command = 'npm run dev-all-local';
  } else {
    console.log('\nInvalid choice. Defaulting to Hugging Face API...\n');
    command = 'npm run dev-all';
  }
  
  // Run the selected command
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    cwd: path.resolve(__dirname)
  });
  
  child.on('error', (error) => {
    console.error(`Error starting the application: ${error.message}`);
    process.exit(1);
  });
  
  rl.close();
}); 