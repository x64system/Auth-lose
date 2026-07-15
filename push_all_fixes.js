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
  'Security fix: lock debug-db endpoint + SameSite=strict cookie (Bug Bounty 2026-07-15)'
);

push(
  'C:\\Users\\lose\\Downloads\\game-sec.dev',
  'Security fix: patch CRIT-02 CRIT-03 MED-02 in auth-check.js (Bug Bounty 2026-07-15)'
);

console.log('All done!');
