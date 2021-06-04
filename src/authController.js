import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import moment from 'moment';

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
        if(!Provider.auth.approvalChecker(user, res)) return;

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


        // company selection process
        let hasCompanies = true;
        const companies = await Mongo.Company.find({user: user._id});
        if(companies.length === 0) hasCompanies = false;

        // token signin
        const token = jwt.sign({ 
            email: user.email,
            firstName: user.firstName, 
            lastName: user.lastName,
            clientType: req.body.client,
        }, process.env.JWT, { expiresIn: 60 * 60 * time().hours });

        // session creation
        const session = new Mongo.Session({
            user: user._id,
            token,
            expiresAt: time().stamp,
            clientType: req.body.client,
            initialIp: req.connection ? req.connection.remoteAddress : "registration",
        });

        await session.save();

        return res.json({
            session: token,
            hasCompanies
        });

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

        return login({
            ...req, 
            connection: {
                remoteAddress: req.connection.remoteAddress
            },
            body: {email: req.body.email, password: req.body.password, client: req.body.client}}, 
            res
        );
    }catch(err) {
        return res.sendStatus(500);
    }
}

export async function ping(req, res, ) {
    try {
        const {error} = Validator.authValidator.ping(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        if(!await Provider.auth.authCheck(req, res, true, true)) return;
        else return res.sendStatus(200);

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function selectCompany(req, res) {
    try {

        const {error} = Validator.authValidator.ping(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        if(!await Provider.auth.authCheck(req, res, true)) return;
        else return res.sendStatus(200);




    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
} 

export async function logout(req, res) {
    try {
        const {error} = Validator.authValidator.ping(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        const session = await Mongo.Session.findOne({token: req.body.session});
        session.status = 2;
        await session.save();

        return res.sendStatus(200);
    }catch(err) {
        console.log(err);
        // 200 is intentional :) 
        return res.sendStatus(200);
    }
}



