import Provider from './_main.js';

export function isOwned (res, u, p) {
    if(String(u.company) !== String(p.company)) return Provider.error(res, "product", "notFound");
    console.log("here")
    return true;
}

export function isUpdatable (product) {
    if(
        product.status < 4
    ) return true;
    else return false
}

export function actionArchiveAmmend(product, type, payload) {
    return [
        ...product.actionsArchive,
        {
            type,
            payload
        }
    ]
}

export async function quantityAndStateToSend(req, res, product) {
    const newStatus = req.body.status;
    const newQuantity = req.body.quantity;
    const {status, quantity} = product;
    const sendSameStateError = () => {
        Provider.error(res, "product", "sameState");
        return "failed";
    }
    const Quantifier = (status, quantity) => Object({status, quantity});

    if(newStatus > 3) {
        Provider.error(res, "product", "cannotUpdate", {reason: "not concordant with current state"});
        return "failed";
    }

    if(newStatus === 0) if(status === newStatus) return sendSameStateError();
    if(newStatus === 1) if(quantity === newQuantity && status === newStatus) return sendSameStateError();

    if(newStatus == 0) return Quantifier(0, 0);
    else if(newStatus == 1) {
        if(newQuantity == 0) return Quantifier(2, 0);
        else return Quantifier(1, newQuantity)
    }else return Quantifier(newStatus, newQuantity)
}