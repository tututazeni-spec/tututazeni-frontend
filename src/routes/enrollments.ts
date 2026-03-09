import { Router, Request, Response } from "express";
import { getEnrollmentByUserAndCourse } from "../services/enrollmentService";

const router = Router();

router.get("/my", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // usuário autenticado
    const courseId = req.query.courseId as string;

    if (!courseId) {
      return res.status(400).json({ message: "courseId é obrigatório" });
    }

    const enrollment = await getEnrollmentByUserAndCourse(userId, courseId);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment não encontrado" });
    }

    return res.json(enrollment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

export default router;
