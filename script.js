// Role Selection
document.getElementById('role-selector').addEventListener('change', function () {
    const role = this.value;

    document.getElementById('admin-login').style.display = role === 'admin' ? 'block' : 'none';
    document.getElementById('patient-form').style.display = role === 'patient' ? 'block' : 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
});

// Admin Login
document.getElementById('admin-login-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    if (username === 'admin' && password === 'password') {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    } else {
        alert('Invalid credentials');
    }
});

// Patient Submission
document.getElementById('patient-input-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const injury = document.getElementById('injury').value;
    const painLevel = parseInt(document.getElementById('pain-level').value);

    const response = await fetch('/add-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ injury, painLevel }),
    });

    const data = await response.json();
    document.getElementById('wait-time').textContent = `Your wait time is approximately ${data.waitTime} minutes.`;
});
