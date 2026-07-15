const { execSync } = require('child_process');
const git = 'C:\\Users\\lose\\AppData\\Local\\GitHubDesktop\\app-3.6.3\\resources\\app\\git\\cmd\\git.exe';

function push(cwd, msg) {
  const opts = { cwd, encoding: 'utf8', timeout: 30000 };
  try {
    execSync(`"${git}" add .`, opts);
    execSync(`"${git}" commit -m "${msg}"`, opts);
    const out = execSync(`"${git}" push`, opts);
    console.log(`✅ ${cwd} → pushed`);
  } catch (e) {
    if (e.stdout && e.stdout.includes('nothing to commit')) {
      console.log(`ℹ️ ${cwd} → nothing to commit`);
    } else {
      console.error(`❌ ${cwd}:`, e.stderr || e.message);
    }
  }
}

push(
  'C:\\Users\\lose\\Downloads\\auth',
  'Security fix: patch CRIT-04, CRIT-05, HIGH-04, HIGH-05, HIGH-06, MED-04 (Bug Bounty Round 2)'
);

push(
  'C:\\Users\\lose\\Downloads\\game-sec.dev',
  'Security fix: patch HIGH-03 DOM XSS (Bug Bounty Round 2)'
);

console.log('All done!');
