import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import moment from 'moment';

function approvalChecker (user, res) {
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

export async function login(req, res) {
    try {
        const {error} = Validator.authValidator.login(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Mongo.User.findOne({email: req.body.email});
        if(!user) return Provider.error(res, "auth", "emailNotFound");

        // password validation
        if(!bcrypt.compareSync(req.body.password, user.password)) return Provider.error(res, "auth", "passwordIncorrect");

        // user approval check
        if(!approvalChecker()) return;

        // session time determination
        const time = () => {
            let hours;
            if(req.body.client == "b") hours = 1;
            else if(req.body.client == "br") hours = 168;
            else if(req.body.client == "and" || req.body.client == "ios") hours == 168;
            else hours = 1;
            return {
                hours,
                stamp: moment().add(hours, "hour").format()
            }
        }

        // token signin
        const token = jwt.sign({ 
            email: user.email,
            firstName: user.firstName, 
            lastName: user.lastName,
            clientType: req.body.client 
        }, process.env.JWT, { expiresIn: 60 * 60 * time().hours });

        // session creation
        const session = new Mongo.Session({
            user: user._id,
            token,
            expiresAt: time().stamp,
            clientType: req.body.client,
            initialIp: req.connection.remoteAddress
        });

        await session.save();

        return res.json({session: token});

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function newFunction (req, res) {
    try {
        const {error} = Validator.authValidator.register(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        const emailCheck = await Mongo.User.findOne({email: req.body.email}).lean();
        if(emailCheck) return Provider.error(res, "auth", "emailExists");

        const {firstName, lastName, email} = req.body;
        const salt = bcrypt.genSaltSync(10);
        const password = bcrypt.hashSync(req.body.password, salt);

        const user = new Mongo.User({
            firstName,
            lastName,
            email,
            password
        });

        await user.save();

        return login({...req, body: {email: req.body.email, password: req.body.password, client: req.body.client}}, res);
    }catch(err) {
        return res.sendStatus(500);
    }
}

export async function ping(req, res) {
    try {
        const {error} = Validator.authValidator.ping(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // rejector function 
        const reject = () => Provider.error(res, "auth", "sessionInvalid");

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
        const user = await Mongo.User.findById(session.user).lean();
        if(!user) return reject();
        if(!approvalChecker(user, res)) {
            session.status = 3;
            await session.save();
            return;
        }

        return res.sendStatus(200);

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}



