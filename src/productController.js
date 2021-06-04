import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';

export async function addProduct(req, res) {
    try {
        const {error} = Validator.productValidator.add(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        const currency = await Mongo.Currency.findOne({uuid: req.body.currency});
        if(!currency) return Provider.error(res, "currency", "notFound");

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
            user: user._id
        });

        await product.save();
    
        return res.sendStatus(200);

    }catch(err) {
        if(err._message === 'Product validation failed') {
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
                }
            }
        }));

        return res.json(products);
    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}


