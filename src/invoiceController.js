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

        const invoiceModelFetch = await Provider.invoice.invoiceModeller(res, req.body.currency, initialProducts, initialTaxes, false, false, user, req.body.reduction);
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
                invoice.reduction = invoiceModel?.reduction;
                invoice.notes = invoiceModel?.notes;
                invoice.updatedAt = new Date();
                invoice.customerDetails = req.body.customerDetails;
                await invoice.save();

                return res.json({invoice: invoice.uuid}); 
            }else {
                const invoice = new Mongo.Invoice({
                    company: user.company,
                    user: user._id,
                    currency: invoiceModel.currency,
                    sums: invoiceModel.sums,
                    grossTaxes: invoiceModel.grossTaxes,
                    products: invoiceModel.products,
                    reduction: invoiceModel?.reduction,
                    notes: invoiceModel?.notes,
                    customerDetails: req.body.customerDetails
                });
        
                await invoice.save();

                return res.json({invoice: invoice.uuid});
            }
    
            
            
        }
    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function fetchOne(req, res) {
    try {
        const {error} = Validator.invoiceValidator.fetchOne(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        // invoices 
        const invoice = await Mongo.Invoice.findOne({uuid: req.body.invoice, company: user.company}).lean();
        if(!invoice) return Provider.error(res, "invoice", "notFound", {invoice: req.body.invoice})

        const invoiceViewer = await Provider.invoice.invoiceViewer(invoice);

        return res.json(invoiceViewer);
    }catch(err) {
        console.log(err);
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
        const fetch = await Mongo.Invoice.find({company: user.company}).lean();

        // const invoices = [];
        // await Promise.all(fetch.map(async invoice => invoices.push(await Provider.invoice.invoiceViewer(invoice))))

        return res.json(await Promise.all(fetch.map(async invoice => Object({
            uuid: invoice.uuid,
            sums: invoice.sums,
            reduction: invoice.reduction,
            finalized: invoice.finalized,
            refunded: invoice.refunded,
            productsCount: Array(...invoice.products).length,
            number: invoice.number,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            customer: invoice.customerDetails,
            currency: Object({
                ...(await Mongo.Currency.findById(invoice.currency).lean()),
                
                _id: undefined
            })
        }))));

    }catch(err) {
        console.log(err);
    }
}

export async function finalizeInvoice (req, res) {
    try {
        const {error} = Validator.invoiceValidator.fetchOne(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        const invoiceRaw = await Mongo.Invoice.findOne({uuid: req.body.invoice, company: user.company});
        if(invoiceRaw.finalized) return Provider.error(res, "invoice", "alreadyFinalized");

        if(!invoiceRaw.customerDetails?.email && !invoiceRaw.customerDetails.phone) return Provider.error(res, "invoice", "noCustomer");


        const invoice = await Provider.invoice.invoiceViewer(invoiceRaw);

        let stop = false;
        let which = "";
        invoice.items.forEach(item => invoice.products.forEach(product => {
            console.log(item.quantity, product.quantity)
            if(item.quantity > product.quantity && !stop && item.status !== 0) {
                stop = true;
                which = item.uuid;
            }
        }));
        
        if(stop) return Provider.error(res, "invoice", "quantityOverflow", {uuid: which});

        let failed = false;
        await Promise.all(invoice.items.map(async item => {
            const product = await Mongo.Product.findOne({uuid: item.uuid});
            if(!product) {
                failed = true;
                return;
            }
            if(item.status !== 0) product.quantity = product.quantity - item.quantity
            await product.save();
            return;
        }));
        if(failed) return res.sendStatus(500);

        invoiceRaw.finalized = true;
        await invoiceRaw.save();

        return res.json({
            invoice: invoiceRaw.uuid
        });

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

