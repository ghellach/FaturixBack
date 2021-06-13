import {Router} from 'express';
import * as authController from "../authController.js";
import * as companyController from '../companyController.js';
import * as invoiceController from "../invoiceController.js";
import * as metaDataController from '../metaDataController.js';
import * as productController from '../productController.js';

import * as userController from '../userController.js';

const router = Router();

// meta data fetch
router.post("/meta/taxes/fetch", metaDataController.fetchTaxes);
router.post("/meta/currencies/fetch", metaDataController.fetchCurrencies);

// auth
router.post("/auth/login", authController.login);
router.post("/auth/new", authController.newFunction);
router.post("/auth/ping", authController.ping);
router.post("/auth/logout", authController.logout);

// company
router.post("/company/add/company", companyController.addCompany);
router.post("/company/fetch/company", companyController.fetchCompany);
router.post("/company/fetch/all", companyController.fetchCompanies);

// user
router.post("/user/select/company", userController.selectCompany);

// invoice
router.post("/invoice/fetch/all", invoiceController.fetchInvoices);

// products
router.post("/product/add", productController.addProduct);
router.post("/product/fetch", productController.fetch);
router.post("/product/fetch/all", productController.fetchProducts);
router.post("/product/update/quantity", productController.updateQuantity);

export default router;