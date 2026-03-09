import prisma from "../lib/prisma";

export async function getEnrollmentByUserAndCourse(
  userId: string,
  courseId: string
) {
  return prisma.enrollment.findFirst({
    where: {
      userId,
      courseId
    }
  });
}
