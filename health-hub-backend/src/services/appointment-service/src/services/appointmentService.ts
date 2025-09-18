import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
import pkg2 from "uuid";
const { v4: uuidv4 } = pkg2;
// Define the Appointment model
class Appointment extends Document {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Create the Dynamoose schema
const AppointmentSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
  },
  patientId: {
    type: String,
    index: {
      global: true,
      name: "PatientIdIndex",
      rangeKey: "dateTime",
    },
  },
  doctorId: {
    type: String,
    index: {
      global: true,
      name: "DoctorIdIndex",
      rangeKey: "dateTime",
    },
  },
  dateTime: String,
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
  },
  notes: {
    type: String,
    required: false,
  },
  createdAt: Date,
  updatedAt: {
    type: Date,
    required: false,
  },
});

// Create the Dynamoose model
const AppointmentModel = dynamoose.model<Appointment>(
  process.env.APPOINTMENT_TABLE!,
  AppointmentSchema,
  {
    create: false,
  }
);

export class AppointmentService {
  async create(
    data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
  ): Promise<Appointment> {
    try {
      console.log("Service criando");
      const newAppointment = new AppointmentModel({
        ...data,
        id: uuidv4(),
        createdAt: new Date(),
        status: data.status || "scheduled",
      });

      await newAppointment.save();
      return newAppointment;
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  }

  async get(id: string): Promise<Appointment | null> {
    try {
      const appointment = await AppointmentModel.get(id);
      return appointment || null;
    } catch (error) {
      console.error("Error getting appointment:", error);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<Omit<Appointment, "id" | "createdAt">>
  ): Promise<Appointment> {
    try {
      const updatedAppointment = await AppointmentModel.update(
        { id },
        { ...data, updatedAt: new Date() }
      );
      return updatedAppointment;
    } catch (error) {
      console.error("Error updating appointment:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await AppointmentModel.delete(id);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      throw error;
    }
  }

  async list(filter?: Partial<Appointment>): Promise<Appointment[]> {
    try {
      let scan = AppointmentModel.scan();

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          scan = scan.filter(key).eq(value);
        });
      }

      const appointments = await scan.exec();
      return appointments;
    } catch (error) {
      console.error("Error listing appointments:", error);
      throw error;
    }
  }

  async findByPatientId(
    patientId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Appointment[]> {
    try {
      let query = AppointmentModel.query("patientId").eq(patientId);

      if (startDate && endDate) {
        query = query.where("dateTime").between(startDate, endDate);
      } else if (startDate) {
        query = query.where("dateTime").ge(startDate);
      } else if (endDate) {
        query = query.where("dateTime").le(endDate);
      }

      const appointments = await query.exec();
      return appointments;
    } catch (error) {
      console.error("Error finding appointments by Patient ID:", error);
      throw error;
    }
  }

  async findByDoctorId(
    doctorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Appointment[]> {
    try {
      let query = AppointmentModel.query("doctorId").eq(doctorId);

      if (startDate && endDate) {
        query = query.where("dateTime").between(startDate, endDate);
      } else if (startDate) {
        query = query.where("dateTime").ge(startDate);
      } else if (endDate) {
        query = query.where("dateTime").le(endDate);
      }

      const appointments = await query.exec();
      return appointments;
    } catch (error) {
      console.error("Error finding appointments by Doctor ID:", error);
      throw error;
    }
  }
}
