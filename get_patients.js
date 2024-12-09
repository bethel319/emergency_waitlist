const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// In-memory data for patients
let patients = [];

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the "public" folder

// Add a new patient
app.post('/add-patient', (req, res) => {
    const { injury, painLevel } = req.body;

    if (!injury || typeof painLevel !== 'number') {
        return res.status(400).json({ error: 'Injury and pain level are required.' });
    }

    const newPatient = {
        id: patients.length + 1,
        injury,
        painLevel,
        timestamp: Date.now()
    };

    patients.push(newPatient);
    res.status(201).json(newPatient);
});

// Get all patients
app.get('/get-patients', (req, res) => {
    const sortedPatients = patients.sort((a, b) => {
        if (b.painLevel !== a.painLevel) return b.painLevel - a.painLevel;
        return a.timestamp - b.timestamp;
    });
    res.status(200).json(sortedPatients);
});

// Mark a patient as treated
app.post('/mark-as-treated', (req, res) => {
    const { id } = req.body;
    const index = patients.findIndex(patient => patient.id === id);

    if (index !== -1) {
        patients.splice(index, 1);
        res.status(200).json({ message: 'Patient removed from the queue.' });
    } else {
        res.status(404).json({ error: 'Patient not found.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
