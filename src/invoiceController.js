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

        const invoiceInit = req.body.invoice ? await Mongo.Invoice.findOne({uuid: req.body?.invoice}) : null;
        if(!invoiceInit && req.body.invoice) return Provider.error(res, "invoice", "notFound")

        const invoiceModelFetch = await Provider.invoice.invoiceModeller(res, req.body.currency, initialProducts, initialTaxes, false, false, user);
        if(!invoiceModelFetch) return;
        else {
            const invoiceModel = await Provider.invoice.toMongoIds(invoiceModelFetch);

            if(req.body.invoice) {
                const invoice = invoiceInit;
                invoice.archive = [...invoiceInit._doc.archive, {...invoiceInit._doc}];
                invoice.user = user._id;
                invoice.currency = invoiceModel.currency;
                invoice.sums = invoiceModel.sums;
                invoice.grossTaxes = invoiceModel.grossTaxes;
                invoice.products = invoiceModel.products;
                invoice.updatedAt = new Date();
                await invoice.save();
            }else {
                const invoice = new Mongo.Invoice({
                    company: user.company,
                    user: user._id,
                    currency: invoiceModel.currency,
                    sums: invoiceModel.sums,
                    grossTaxes: invoiceModel.grossTaxes,
                    products: invoiceModel.products
                });
        
                await invoice.save();
            }
    
            
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

