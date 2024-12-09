const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Initialize the app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool({
    user: 'postgres',              // Replace with your PostgreSQL username
    host: 'localhost',             // Replace with your host (e.g., localhost)
    database: 'emergency-waitlist',          // Replace with your database name
    password: 'Password123',     // Replace with your PostgreSQL password
    port: 5432,                    // Default PostgreSQL port
});

// Routes

// Health Check
app.get('/', (req, res) => {
    res.send('Hospital Triage App API is running.');
});

// Add a New Patient
app.post('/add-patient', async (req, res) => {
    const { injury, painLevel } = req.body;

    if (!injury || typeof painLevel !== 'number') {
        return res.status(400).json({ error: 'Injury and pain level are required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO patients (injury, pain_level, wait_time) VALUES ($1, $2, $3) RETURNING *',
            [injury, painLevel, calculateWaitTime(painLevel)]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add patient.' });
    }
});

// Get All Patients
app.get('/get-patients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patients ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve patients.' });
    }
});

// Mark Patient as Treated
app.post('/mark-as-treated', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Patient ID is required.' });
    }

    try {
        const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Patient not found.' });
        }
        res.status(200).json({ message: 'Patient marked as treated.', patient: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark patient as treated.' });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Helper Function
function calculateWaitTime(painLevel) {
    // Example logic: Higher pain level -> shorter wait time
    return 60 - painLevel * 5;
}
