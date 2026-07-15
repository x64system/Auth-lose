fetch('https://auth-lose-kappa.vercel.app/api/debug-db')
.then(res => {
  console.log("Status:", res.status);
  return res.json();
})
.then(data => console.log("Data:", data))
.catch(err => console.error("Error:", err));
