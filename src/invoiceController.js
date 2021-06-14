import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';

export async function draftInvoice(req, res) {
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

        const invoiceModelFetch = await Provider.invoice.invoiceModeller(res, req.body.currency, initialProducts, initialTaxes, req.body.invoice ? false : true);
        if(!invoiceModelFetch) return;
        else {
            const invoiceModel = await Provider.invoice.toMongoIds(invoiceModelFetch);

            console.log(invoiceModel);
    
            const invoice = new Mongo.Invoice({
                company: user.company,
                user: user._id,
                currency: invoiceModel.currency,
                sums: invoiceModel.sums,
                grossTaxes: invoiceModel.grossTaxes,
                products: invoiceModel.products
            });
    
            await invoice.save();
            return res.json({saved: true});
        }
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

