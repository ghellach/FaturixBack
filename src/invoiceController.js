import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import moment from 'moment';

export async function addInvoice(req, res) {
    try {
        const {error} = Validator.authValidator.login(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res);
        if(!user) return;

        

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}
