const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

// Initialize the app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// PostgreSQL connection
const pool = new Pool({
    user: 'postgres', // Update with your PostgreSQL username
    host: 'localhost', // Update with your host (e.g., localhost)
    database: 'emergency_waitlist', // Update with your database name
    password: 'Password123', // Update with your PostgreSQL password
    port: 5432, // Default PostgreSQL port
});

// Routes

// Health Check
app.get('/api', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        console.log('Health check: Database connection is successful');
        res.status(200).send('API is running, and database is connected.');
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).send('API is running, but database connection failed.');
    }
});

// Login Endpoint for Admin Authentication
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Basic Input Validation
    if (!username || !password) {
        return res.status(400).json({ status: 'fail', message: 'Username and password are required.' });
    }

    try {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
        if (result.rowCount === 0) {
            // No admin found with the given username
            return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
        }

        const admin = result.rows[0];
        // In a production environment, use bcrypt.compare to check hashed passwords
        if (admin.password !== password) {
            return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
        }

        // If credentials match, return success and role 'admin'
        return res.status(200).json({ status: 'success', role: 'admin' });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// Get All Patients
app.get('/admin/patients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patients ORDER BY patient_id ASC');
        console.log('Patients retrieved:', result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving patients:', error);
        res.status(500).json({ error: 'Failed to retrieve patients.' });
    }
});

// Add a New Patient
app.post('/admin/patients', async (req, res) => {
    const { name, gender, date_of_birth, contact, priority_id, medical_issue } = req.body;

    // Input Validation
    if (!name || !gender || !date_of_birth || !contact || typeof priority_id !== 'number' || !medical_issue) {
        console.error('Invalid input for adding patient:', req.body);
        return res.status(400).json({ error: 'Invalid input. All fields are required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO patients (name, gender, date_of_birth, contact, priority_id, medical_issue) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, gender, date_of_birth, contact, priority_id, medical_issue]
        );
        console.log('New patient added:', result.rows[0]);
        res.status(201).json({ success: true, patient: result.rows[0] });
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({ error: 'Failed to add patient.' });
    }
});

// Assign Room & Doctor
app.put('/admin/patients/assign', async (req, res) => {
    const { patient_id, doctor_id, room_id } = req.body;

    // Input Validation
    if (!patient_id || !doctor_id || !room_id) {
        console.error('Invalid input for assigning room/doctor:', req.body);
        return res.status(400).json({ error: 'Invalid input. All fields are required.' });
    }

    try {
        const result = await pool.query(
            'UPDATE patients SET doctor_id = $1, room_id = $2 WHERE patient_id = $3 RETURNING *',
            [doctor_id, room_id, patient_id]
        );

        if (result.rowCount === 0) {
            console.log('Patient not found for assignment:', patient_id);
            return res.status(404).json({ error: 'Patient not found.' });
        }

        console.log('Room and doctor assigned successfully:', result.rows[0]);
        res.status(200).json({ message: 'Assignment successful', patient: result.rows[0] });
    } catch (error) {
        console.error('Error assigning room and doctor:', error);
        res.status(500).json({ error: 'Failed to assign room and doctor.' });
    }
});

// Get Wait Time
app.get('/user/wait-time', async (req, res) => {
    const { userId } = req.query;

    // Input Validation
    if (!userId) {
        console.error('Invalid input for fetching wait time:', req.query);
        return res.status(400).json({ error: 'Invalid input. User ID is required.' });
    }

    try {
        const result = await pool.query('SELECT priority_id FROM patients WHERE patient_id = $1', [userId]);

        if (result.rowCount === 0) {
            console.log('Patient not found for wait time:', userId);
            return res.status(404).json({ error: 'Patient not found.' });
        }

        const priority = result.rows[0].priority_id;
        const waitTime = calculateWaitTime(priority);
        console.log('Calculated wait time:', { userId, waitTime, priority });
        res.status(200).json({ waitTime, queuePosition: priority });
    } catch (error) {
        console.error('Error fetching wait time:', error);
        res.status(500).json({ error: 'Failed to fetch wait time.' });
    }
});

// Helper function to calculate wait time
function calculateWaitTime(priority) {
    return Math.max(60 - priority * 5, 5); // Example logic: Higher priority = shorter wait time
}

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
