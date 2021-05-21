import envVariables from '../../env.config.js';
import mongoose from 'mongoose';

export const env = async () => {
    try {
        process.env = {
            ...process.env, 
            ...envVariables
        }
        return;
    }catch(err) {
        console.log("Fatal error during env variables init");
        process.exit(1);
    }
}


export const db = async () => {
    await mongoose.connect(process.env.MONGO_DB_1_URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: true,
        useUnifiedTopology: true,
    }, () => {
        console.log(Date(), "| MongoDB connections have been established.")
    })
}

export const httpConnection = async (app) => app.listen(process.env.APP_PORT, () => {
    console.log(Date(), "| http server up and running on port", process.env.APP_PORT);
})