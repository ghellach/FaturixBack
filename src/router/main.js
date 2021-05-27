import {Router} from 'express';
import * as authController from "../authController.js";
import * as companyController from '../companyController.js';

const router = Router();

router.post("/auth/login", authController.login);
router.post("/auth/new", authController.newFunction);
router.post("/auth/ping", authController.ping);

router.post("/company/add/company", companyController.addCompany);
router.post("/company/fetch/company", companyController.fetchCompany);

export default router;