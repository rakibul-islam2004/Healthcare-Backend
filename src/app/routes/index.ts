import { Router } from "express";
import { SpecialtyRoutes } from "../module/specialty/specialty.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { UserRoutes } from "../module/user/user.route";
import { DoctorRouter } from "../module/doctor/doctor.route";

const router = Router();

router.use("/specialties", SpecialtyRoutes);
router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/doctors", DoctorRouter);

export const IndexRoutes = router;
