import Mongo from '../models/_main.js';
import Provider from './_main.js';
import jwt from 'jsonwebtoken';

export function approvalChecker (user, res) {
    // user approval check
    if(user.status == 2) {
        Provider.error(res, "auth", "accountSuspended");
        return false;
    }
    else if (user.status == 3) {
        Provider.error(res, "auth", "accountNotActivated");
        return false;
    }
    return true;
}

export async function authCheck(req, res, userNope) {
    // rejector function 
    const reject = () => {
        Provider.error(res, "auth", "sessionInvalid");
        return false;
    }

    // jwt check
    try {
        jwt.verify(req.body.session, process.env.JWT);
    }
    catch(err) {
        return reject();
    }

    //session fetch
    const session = await Mongo.Session.findOne({token: req.body.session});
    if(!session || session.status !== 1) return reject();
    // user fetch
    const user = await Mongo.User.findById(session.user);
    if(!user) return reject();
    if(!approvalChecker(user, res)) {
        session.status = 3;
        await session.save();
        return;
    }

    if(userNope) return true;
    else return user;
}