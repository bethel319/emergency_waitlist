document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const loginSection = document.getElementById("login-section");
    const adminDashboard = document.getElementById("admin-dashboard");
    const loginForm = document.getElementById("login-form");
    const loginMessage = document.getElementById("login-message");
    const viewPatientsBtn = document.getElementById("view-patients-btn");
    const addPatientBtn = document.getElementById("add-patient-btn");
    const patientsList = document.getElementById("patients-list");
    const addPatientForm = document.getElementById("add-patient-form");
    const submitPatientBtn = document.getElementById("submit-patient-btn");

    // Utility function to show/hide sections
    function toggleVisibility(element, show) {
        if (show) {
            element.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
        }
    }

    // Format date to a readable format
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Handle Login
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const code = document.getElementById("code").value.trim();

        if (!name || !code) {
            loginMessage.textContent = "Please enter both name and code.";
            loginMessage.style.color = "red";
            return;
        }

        if (name.toLowerCase() === "admin" && code === "admin123") {
            toggleVisibility(loginSection, false);
            toggleVisibility(adminDashboard, true);
        } else {
            loginMessage.textContent = "Invalid credentials.";
            loginMessage.style.color = "red";
        }
    });

    // View All Patients
    viewPatientsBtn.addEventListener("click", () => {
        fetch("http://localhost:3000/admin/patients")
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch patients: HTTP ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                if (!data || data.length === 0) {
                    patientsList.innerHTML = "<p>No patients found.</p>";
                } else {
                    const tableHTML = `
                        <table>
                            <thead>
                                <tr>
                                    <th>Patient ID</th>
                                    <th>Name</th>
                                    <th>Gender</th>
                                    <th>Date of Birth</th>
                                    <th>Contact</th>
                                    <th>Priority ID</th>
                                    <th>Medical Issue</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(patient => `
                                    <tr>
                                        <td>${patient.patient_id}</td>
                                        <td>${patient.name}</td>
                                        <td>${patient.gender}</td>
                                        <td>${formatDate(patient.date_of_birth)}</td>
                                        <td>${patient.contact}</td>
                                        <td>${patient.priority_id}</td>
                                        <td>${patient.medical_issue || ''}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                    patientsList.innerHTML = `<h3>All Patients</h3>${tableHTML}`;
                }
                toggleVisibility(patientsList, true);
            })
            .catch((error) => {
                console.error("Failed to fetch patients:", error.message);
                alert("Failed to fetch patients. Please check your server and try again.");
            });
    });

    // Add New Patient
    addPatientBtn.addEventListener("click", () => {
        toggleVisibility(addPatientForm, true);
    });

    submitPatientBtn.addEventListener("click", () => {
        const name = document.getElementById("patient-name").value.trim();
        const gender = document.getElementById("patient-gender").value.trim();
        const date_of_birth = document.getElementById("patient-dob").value;
        const contact = document.getElementById("patient-contact").value.trim();
        const priority_id = parseInt(document.getElementById("patient-priority").value);
        const medical_issue = document.getElementById("patient-issue").value.trim();

        if (!name || !gender || !date_of_birth || !contact || isNaN(priority_id) || !medical_issue) {
            alert("Please fill out all fields correctly.");
            return;
        }

        fetch("http://localhost:3000/admin/patients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, gender, date_of_birth, contact, priority_id, medical_issue }),
        })
            .then((response) => {
                if (!response.ok) throw new Error(`Failed to add patient: HTTP ${response.status}`);
                return response.json();
            })
            .then((patient) => {
                alert(`Patient ${patient.name} added successfully!`);
                addPatientForm.reset();
                toggleVisibility(addPatientForm, false);
            })
            .catch((error) => {
                console.error("Failed to add patient:", error.message);
               
            });
    });
});
