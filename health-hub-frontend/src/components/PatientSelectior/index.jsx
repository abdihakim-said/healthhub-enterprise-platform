import React, { useState, useEffect } from "react";
import { patientService } from "../../services/api";

const PatientSelector = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await patientService.getPatients();
        setPatients(response.data);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, []);

  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    setSelectedPatientId(patientId);
    onSelectPatient(patientId);
  };

  return (
    <select
      className="border rounded p-2"
      value={selectedPatientId}
      onChange={handlePatientChange}
    >
      <option value="">Select a patient</option>
      {patients.map((patient) => (
        <option key={patient.id} value={patient.id}>
          {patient.firstName} {patient.lastName}
        </option>
      ))}
    </select>
  );
};

export default PatientSelector;
