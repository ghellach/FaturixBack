import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';
import moment from 'moment';

export async function addProduct(req, res) {
    try {
        const {error} = Validator.productValidator.add(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        // check if previous block in the chain
        let previous = {};
        if(req.body.previousBlock) {
            previous = await Mongo.Product.findOne({uuid: String(req.body.previousBlock)});
            if(!previous) return Provider.error(res, "product", "previousBlockNotFound");
            if(!Provider.product.isOwned(res, user, previous)) return;
            previous.updatedAt = new Date;
            previous.status = 4;
            await previous.save();
        }

        const currency = await Mongo.Currency.findOne({uuid: req.body.currency});
        if(!currency) return Provider.error(res, "currency", "notFound");
        console.log(req.body)
        let unitTaxes = [];
        let exit = false;
        try {
            await Promise.all(await req.body.unitTaxes.map(async unitTax => {
                let tax = false;
                const t = await Mongo.Tax.findOne({uuid: unitTax.uuid ?? "none"});
                if(t) {
                    tax = {
                        uuid: t.uuid,
                        names: t.names,
                        rate: t.rate
                    }
                }else {
                    if(!unitTax.name || !unitTax.rate) exit = false; 
                    tax = {
                        names: unitTax.names,
                        rate: Number(unitTax.rate)
                    }
                }

                if(!tax) exit = true;
                unitTaxes.push(tax);
            }));
        }catch(err) {
            exit = true;
        }
        if(exit) return Provider.error(res, "product", "missingTaxInfo");
        
        // product creation
        const product = new Mongo.Product({
            name: req.body.name,
            unitPrice: Number(req.body.unitPrice),
            unitTaxes,
            currency: currency._id,
            company: user.company,
            user: user._id,
            previousBlock: previous._id
        });

        await product.save();
    
        return res.json({
            uuid: product.uuid
        });

    }catch(err) {
        if(err._message === 'Product validation failed') {
            console.log(err);
            return Provider.error(res, "product", "incorrectTaxFormat")
        }
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function fetchProducts(req, res) {
    try {
        const {error} = Validator.authValidator.ping(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        // products
        const fetch = await Mongo.Product.find({company: user.company}).lean();

        const products = await Promise.all(fetch.map(async product => {
            const currency = await Mongo.Currency.findById(product.currency).lean();
            return {
                ...product,
                _id: undefined,
                currency: {
                    ...currency,
                    _id: undefined
                },
                actionsArchive: product.actionsArchive ? product.actionsArchive.reverse() : []
            }
        }));

        return res.json(products);
    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function updateQuantity(req, res) {
    try {
        const {error} = Validator.productValidator.updateQuantity(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        // product fetch and checks actions
        const product = await Mongo.Product.findOne({uuid: req.body.uuid});
        if(!product) return Provider.error(res, "product", "notFound");
        if(!Provider.product.isOwned(res, user, product)) return;
        if(!Provider.product.isUpdatable(product)) return Provider.error(res, "product", "cannotUpdate", {reason: "not concordant with current state"});

        // all check and do updates
        const previousQuantity = product.quantity;
        const previousStatus = product.status;
        const updater = await Provider.product.quantityAndStateToSend(req, res, product);
        if(updater === "failed") return;
        const {quantity, status} = updater;
        
        product.actionsArchive = Provider.product.actionArchiveAmmend(product, "quantityUpdate", {
            from: previousQuantity,
            to: quantity,
            fromStatus: previousStatus,
            toStatus: status
        });
        product.status = status;
        product.quantity = quantity;
        await product.save();

        return res.sendStatus(200);

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function updateStatus(req, res) {
    try {
        const {error} = Validator.productValidator.updateQuantity(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        // product fetch actions
        const product = await Mongo.Product.findOne({uuid: req.body.uuid});
        if(!product) return Provider.error(res, "product", "notFound");
        if(!Provider.product.isOwned(res, user, product)) return;
        

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}


