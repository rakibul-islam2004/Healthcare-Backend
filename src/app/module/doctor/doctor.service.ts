import { prisma } from "../../lib/prisma";

const getAllDoctors = async () => {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
      specialties: {
        include: {
          specialty: true,
        },
      },
    },
  });
  return doctors;
};

// const getDoctorById = async (id: string) => {};
// const updateDoctor = async (id: string) => {};
// // soft delete
// const deleteDoctor = async (id: string) => {};

export const DoctorService = {
  getAllDoctors,
};
