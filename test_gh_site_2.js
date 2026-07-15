fetch('https://loselost.vercel.app/login.html')
.then(res => res.text())
.then(html => {
  console.log("=== login.html ===");
  const lines = html.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('API_VALIDATION_URL') || lines[i].includes('localhost') || lines[i].includes('auth-lose')) {
      console.log(`${i + 1}: ${lines[i].trim()}`);
    }
  }
})
.catch(err => console.error("Error fetching login.html:", err));

fetch('https://loselost.vercel.app/auth-check.js')
.then(res => res.text())
.then(js => {
  console.log("=== auth-check.js ===");
  const lines = js.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('localhost') || lines[i].includes('auth-lose') || lines[i].includes('licenses/validate')) {
      console.log(`${i + 1}: ${lines[i].trim()}`);
    }
  }
})
.catch(err => console.error("Error fetching auth-check.js:", err));
