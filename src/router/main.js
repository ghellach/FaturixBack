import {Router} from 'express';
import * as authController from "../authController.js";
import * as companyController from '../companyController.js';
import * as userController from '../userController.js';

const router = Router();

router.post("/auth/login", authController.login);
router.post("/auth/new", authController.newFunction);
router.post("/auth/ping", authController.ping);
router.post("/auth/logout", authController.logout);

router.post("/company/add/company", companyController.addCompany);
router.post("/company/fetch/company", companyController.fetchCompany);
router.post("/company/fetch/all", companyController.fetchCompanies);

router.post("/user/select/company", userController.selectCompany);

export default router;