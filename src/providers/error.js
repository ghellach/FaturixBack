import path from 'path';
import fs from 'fs';
import Provider from './_main.js';

export default function errorEval (res, section, code, body) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(path.resolve(), "src/data/errors.json")).toString());
        const error = data[section][code];
    
        res.status(error.status).json({
            section: String(section),
            code: String(code),
            status: error.status,
            message: error.message,
            body: error.body ? body ? body : undefined : undefined
        });
    
        return;
    } catch (err) {
        res.sendStatus(500);
    }
    
}