import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';

export async function fetchTaxes(req, res) {
    try {
        const {error} = Validator.authValidator.ping(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        // taxes fetcher
        const taxes = await Mongo.Tax.find().lean();

        return res.json(taxes.map(t => Object({...t, _id: undefined})));
       

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function fetchCurrencies(req, res) {
    try {
        const {error} = Validator.authValidator.ping(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        // taxes fetcher
        const currencies = await Mongo.Currency.find().lean();

        return res.json(currencies.map(c => Object({...c, _id: undefined})));
       

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}


