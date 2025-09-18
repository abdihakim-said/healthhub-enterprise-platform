import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  doctorService,
  patientService,
  appointmentService,
  aiInteractionService,
} from "../../services/api";
import { Card } from "../SharedComponents";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalAIInteractions, setTotalAIInteractions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [patients, doctors, appointments, aiInteractions] =
          await Promise.all([
            patientService.getPatients(),
            doctorService.getDoctors(),
            appointmentService.getAppointments(),
            aiInteractionService.getAIInteractions(),
          ]);

        setTotalPatients(patients.data.length);
        setTotalDoctors(doctors.data.length);
        setTotalAppointments(appointments.data.length);
        setTotalAIInteractions(aiInteractions.data.length);

        // Simulating data for the chart
        setData([
          { name: "Jan", value: 400 },
          { name: "Feb", value: 300 },
          { name: "Mar", value: 600 },
          { name: "Apr", value: 800 },
          { name: "May", value: 500 },
          { name: "Jun", value: 700 },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderLoading = () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (isLoading) {
    return renderLoading();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <Card title="Total Patients" value={totalPatients} color="blue" />
        <Card title="Total Doctors" value={totalDoctors} color="green" />
        <Card
          title="Total Appointments"
          value={totalAppointments}
          color="purple"
        />
        <Card
          title="AI Interactions"
          value={totalAIInteractions}
          color="orange"
        />
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Patient Interactions Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
