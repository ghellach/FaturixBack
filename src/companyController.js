import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';

export async function addCompany (req, res) {
    try {

        const {error} = Validator.companyValidator.addCompany(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        const user = await Provider.auth.authCheck(req, res, false, true);
        if(!user) return;
        console.log(user);

        const checkNoIdenticallyNamed = await Mongo.Company.findOne({name: req.body.name});
        if(checkNoIdenticallyNamed) return Provider.error(res, "company", "sameNameCompany");

        const company = new Mongo.Company({
            name: req.body.name,
            user: user._id
        });

        await company.save();

        console.log(company);

        const session = await Mongo.Session.findOne({token: req.body.session});
        session.selectedCompany = true;
        session.whichCompany = company._id;
        await session.save();

        return res.json({
            company: company.uuid,
        });

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function fetchCompany(req, res) {
    try {

        const {error} = Validator.companyValidator.fetchCompany(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        const user = await Provider.auth.authCheck(req, res, false, true);
        if(!user) return;

        const company = await Mongo.Company.findOne({uuid: req.body.uuid, user: user._id});
        if(!company) return Provider.error(res, "company", "notFound");

        const session = await Mongo.Session.findOne({token: req.body.session});
        session.selectedCompany = true;
        session.whichCompany = company._id;
        await session.save();


        return res.json({
            uuid: company.uuid,
            name: company.name
        });

    }catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}