import React, { useState, useEffect } from "react";
import { appointmentService, doctorService } from "../../services/api";
import { Trash2 } from "lucide-react";

const Appointments = ({ userId }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newAppointment, setNewAppointment] = useState({
    doctorId: "",
    dateTime: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const appointmentsResponse = await appointmentService.getAppointments({
          patientId: userId,
        });
        setAppointments(appointmentsResponse.data);

        const doctorsResponse = await doctorService.getDoctors();
        setDoctors(doctorsResponse.data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const response = await appointmentService.createAppointment({
        ...newAppointment,
        patientId: userId,
      });
      setAppointments([...appointments, response.data]);
      setShowModal(false);
      setNewAppointment({ doctorId: "", dateTime: "", notes: "" });
    } catch (error) {
      console.error("Error creating appointment:", error);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await appointmentService.deleteAppointment(appointmentId);
        setAppointments(appointments.filter((app) => app.id !== appointmentId));
      } catch (error) {
        console.error("Error deleting appointment:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => setShowModal(true)}
        >
          Create Appointment
        </button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        {appointments.length > 0 ? (
          <ul>
            {appointments
              .sort(
                (a, b) =>
                  new Date(a.dateTime).getDate() -
                  new Date(b.dateTime).getDate()
              )
              .map((appointment) => (
                <li
                  key={appointment.id}
                  className="mb-4 p-2 border-b flex justify-between items-center"
                >
                  <div>
                    <p>
                      Date: {new Date(appointment.dateTime).toLocaleString()}
                    </p>
                    <p>
                      Doctor: Dr.{" "}
                      {doctors.find((e) => e.id === appointment.doctorId) &&
                        doctors.find((e) => e.id === appointment.doctorId)
                          .firstName}
                    </p>
                    <p>Status: {appointment.status}</p>
                    {appointment.notes && <p>Notes: {appointment.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteAppointment(appointment.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p>No appointments scheduled</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Create New Appointment</h3>
            <form onSubmit={handleCreateAppointment}>
              <div className="mb-4">
                <label className="block mb-2">Doctor</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newAppointment.doctorId}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      doctorId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2">Date and Time</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 border rounded"
                  value={newAppointment.dateTime}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      dateTime: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Notes</label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={newAppointment.notes}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      notes: e.target.value,
                    })
                  }
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
