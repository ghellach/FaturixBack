import Mongo from './models/_main.js';
import Validator from './validators/_main.js';
import Provider from './providers/_main.js';

export async function selectCompany(req, res) {
    try {
        const {error} = Validator.userValidator.selectCompany(req.body);
        if(error) return Provider.error(res, "main", "val", error);

        // user fetch
        const user = await Provider.auth.authCheck(req, res, false, true);
        if(!user) return;

        // company fetch
        const company = await Mongo.Company.findOne({user: user._id, uuid: req.body.uuid});
        if(!company) return Provider.error(res, "company", "notFound");

        // else
        const session = await Mongo.Session.findOne({token: req.body.session});
        session.selectedCompany = true;
        session.whichCompany = company._id;
        await session.save();

        return res.sendStatus(200);
        
    }catch(err) {
        console.log(err);
    }
}
