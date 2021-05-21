import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';

export async function login(req, res) {
    try {
        const {error} = Validator.authValidator.login(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        return res.send("OK");

    }catch(err) {
        return res.sendStatus(500);
    }
}