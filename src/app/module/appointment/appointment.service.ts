import { v7 as uuidv7 } from "uuid";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { IBookAppointmentPayload } from "./appointment.interface";
import { AppointmentStatus, Role } from "../../../generated/prisma/enums";
import status from "http-status";
import AppError from "../../errorHelpers/AppError";

const bookAppointment = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId,
    },
  });

  await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
      },
    },
  });

  const videoCallingId = uuidv7();

  const result = await prisma.$transaction(async (tx) => {
    const appointmentData = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        patientId: patientData.id,
        scheduleId: payload.scheduleId,
        videoCallingId,
      },
    });

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    // Todo: Payment integration will be here

    return appointmentData;
  });

  return result;
};

const getMyAppointments = async (user: IRequestUser) => {
  const patientData = await prisma.patient.findUnique({
    where: {
      email: user?.email,
    },
  });

  const doctorData = await prisma.doctor.findUnique({
    where: {
      email: user?.email,
    },
  });

  // eslint-disable-next-line no-useless-assignment
  let appointments = [];

  if (patientData) {
    appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  } else if (doctorData) {
    appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  } else {
    throw new Error("User not found");
  }

  return appointments;
};

const changeAppointmentStatus = async (
  appointmentId: string,
  appointmentStatus: AppointmentStatus,
  user: IRequestUser,
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
    include: {
      doctor: true,
      patient: true,
    },
  });

  if (
    appointmentData.status === AppointmentStatus.COMPLETED ||
    appointmentData.status === AppointmentStatus.CANCELED
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "Completed or Cancelled appointments cannot be updated",
    );
  }

  if (user?.role === Role.DOCTOR) {
    if (user?.email !== appointmentData.doctor.email) {
      throw new AppError(status.FORBIDDEN, "This is not your appointment");
    }

    const allowedTransitions: AppointmentStatus[] = [
      AppointmentStatus.INPROGRESS,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELED,
    ];

    if (!allowedTransitions.includes(appointmentStatus)) {
      throw new AppError(status.BAD_REQUEST, "Invalid status transition");
    }
  }

  if (user?.role === Role.PATIENT) {
    if (user?.email !== appointmentData.patient.email) {
      throw new AppError(status.FORBIDDEN, "This is not your appointment");
    }

    if (
      appointmentStatus === AppointmentStatus.CANCELED &&
      appointmentData.status !== AppointmentStatus.SCHEDULED
    ) {
      throw new AppError(
        status.BAD_REQUEST,
        "Only scheduled appointments can be cancelled",
      );
    }

    if (appointmentStatus !== AppointmentStatus.CANCELED) {
      throw new AppError(
        status.BAD_REQUEST,
        "Patients are only allowed to cancel appointments",
      );
    }
  }

  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: appointmentStatus },
  });
};

export const AppointmentService = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
};
