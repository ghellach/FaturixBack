import {Router} from 'express';
import * as authController from "../authController.js";

const router = Router();

router.post("/auth/login", authController.login);
router.post("/auth/new", authController.newFunction);
router.post("/auth/ping", authController.ping);

export default router;