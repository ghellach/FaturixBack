import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';

export async function addInvoice(req, res) {
    try {
        const {error} = Validator.invoiceValidator.addInvoice(req.body);
        if(error) return Provider.error(res, "main", "val", error);


        // source params
        // 1- taxes
        // 2- products

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        let initialProducts = req.body.products;
        let initialTaxes = req.body.taxes;

        const invoiceModelFetch = await Provider.invoice.invoiceModeller(res, initialProducts, initialTaxes)
        if(!invoiceModelFetch) return res.sendStatus(400);
        const invoiceModel = await Provider.invoice.toMongoIds(invoiceModelFetch);
        return res.json(invoiceModel);
        
    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function fetchInvoices(req, res) {
    try {
        const {error} = Validator.authValidator.ping(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        // invoices 
        const invoices = await Mongo.Invoice.find({company: user.company});

        return res.json(invoices);
    }catch(err) {
        console.log(err);
    }
}

