import Mongo from '../models/_main.js';
import Provider from './_main.js';

async function productProvider (uuid, checkAvailability, company) {
    const p = await Mongo.Product.findOne({uuid, company, status: checkAvailability ? {$lte: 1} : {$lte: 2}}).lean();
    if(!p) return false;
    else return p;
}

async function taxProvider(uuid) {
    return await Mongo.Tax.findOne({uuid}).lean()
}

async function currencyProvider(currency) {
    return await Mongo.Currency.findOne({uuid: currency})
}

async function errorHandler(code, res, par) {
    if(code === "badParams") Provider.error(res, "invoice", "badParams");
    else if(code === "notAvailable") Provider.error(res, "invoice", "notAvailable", {uuid: par});
    else return false;
    return false;
}

export async function invoiceModeller (res, cur, initialProducts, initialTaxes, checkAvailability, checkQuantity, user, reduction) {

    /*
        takes in: res object, initial products and initial taxes
        needs: product provider with uuid and same for taxprovider
    */

    try {
        // taxes init
        let taxes = [];
        let taxesBody = [];
        let rejectT = false;

        // currencty checl
        const currency = await currencyProvider(cur);
        if(!currency) return errorHandler("badParams", res);

        // used taxes maper
        await Promise.all(initialTaxes.map(async tax => {
            if(rejectT) return;
            const fetch = await taxProvider(tax);
            if(!fetch) {
                rejectT = true;
                console.log(tax);
                return errorHandler("badParams", res);
            }else {
                taxes.push(fetch.uuid);
                taxesBody.push(fetch);
            }
        }));
        if(rejectT) return false;

        // products fetch
        let rejectP = false;
        const products = await Promise.all(initialProducts.map(async (ident) => {
            // prevent crash by checking previous error
            if(rejectP) return false;

            const product = await productProvider(ident.uuid, checkAvailability, user.company);
            if(!product) {
                rejectP = true;
                return errorHandler("notAvailable", res, ident.uuid);
            }

            if(checkQuantity && product.status !== 0) if(!ident.quantity || ident?.quantity > product.quantity) {
                rejectP = true;
                return Provider.error(res, "invoice", "notAvailable", product.uuid);
            }

            const quantity = ident.quantity;
            const unitPrice = ident.unitPrice ? ident.unitPrice : product.unitPrice;

            const priceComputing = () => {
                let taxCal = [];
                let otherTaxCal = [];
                
                product.unitTaxes.forEach(t => {
                    if(t.uuid) {
                        taxes.forEach(c => {
                            if(t.uuid === c) {
                                taxCal.push({uuid: t.uuid, value: unitPrice*(1+t.rate*0.01)-unitPrice})
                            }
                        })
                    }else {
                        otherTaxCal.push({name: t.names.en, value: unitPrice*(1+t.rate*0.01)-unitPrice})
                    }
                });

                let finalUnitPrice = unitPrice;

                taxCal.forEach(t => finalUnitPrice = finalUnitPrice+t.value)
                otherTaxCal.forEach(t => finalUnitPrice = finalUnitPrice+t.value)

                const unit = {
                    subTotal: unitPrice,
                    total: finalUnitPrice,
                    taxes: taxCal.map(t => {
                        return {
                            uuid: t.uuid,
                            value: t.value
                        }
                    }),
                    otherTaxes: otherTaxCal.map(t => {
                        return {
                            name: t.name,
                            value: t.value
                        }
                    })
                }

                const total = {
                    subTotal: unit.subTotal*quantity,
                    total: finalUnitPrice*quantity,
                    taxes: unit.taxes.map(t => {
                        return {
                            ...t,
                            value: t.value*quantity,
                        }
                    }),
                    otherTaxes: otherTaxCal.map(t => {
                        return {
                            name: t.name,
                            value: t.value*quantity
                        }
                    })
                }

                const p = {
                    _id: product._id,
                    quantity,
                    unit,
                    total
                }

                return p
            }

            return priceComputing();

        }));

        if(rejectP) return false;

        const finalTaxes = taxesBody.map(tax => {
            let sum = 0;
            products.forEach(product => {
                product.total.taxes.forEach(t => {
                    if(tax.uuid === t.uuid) sum = sum + t.value;
                })
            });
            return {
                ...tax, 
                total: sum
            }
        });

        const finalOtherTaxes = [];
        products.forEach(product =>  product.total.otherTaxes.forEach(t => finalOtherTaxes.push({...t, value: undefined, total: t.value, product: product._id})));

        let taxesTotal = 0;
        Array(...finalTaxes, ...finalOtherTaxes).forEach(tax => taxesTotal = taxesTotal+tax.total);
        let subTotal = 0;
        products.forEach(p => subTotal = subTotal + p.total.subTotal);
        let grossTotal = subTotal + taxesTotal;

        if(reduction) {
            if(reduction.type === 0) {
                grossTotal = grossTotal * 0.01*(100-Number(reduction.payload))
            }
            else if (reduction.type === 2) {
                if(reduction.payload >= grossTotal) grossTotal = 0
                else grossTotal = grossTotal - Number(reduction.payload)
            }
        }

        const body = {
            currency: currency._id,
            sums: {
                taxesTotal: Number(taxesTotal).toFixed(2),
                subTotal: Number(subTotal).toFixed(2),
                grossTotal: Number(grossTotal).toFixed(2)
            },
            reduction,
            grossTaxes: [...finalTaxes, ...finalOtherTaxes],
            products
        }

        return body;
    }catch(err) {
        console.log(err);
        return false;
    }
}

export async function toMongoIds (body) {
    
    return {
        ...body,
        sums: body.sums,
        grossTaxes: await Promise.all(body.grossTaxes.map(async tax => {
            return {
                ...tax,
                uuid: undefined
            }
        })),
        products: await Promise.all(body.products.map(async product => {
            return {
                ...product,
                unit: {
                    ...product.unit,
                    taxes: await Promise.all(product.unit.taxes.map(async tax => {
                        const t = await Mongo.Tax.findOne({uuid: tax.uuid}).lean();
                        return {
                            _id: t._id,
                            ...tax,
                            uuid: undefined
                        }
                    }))
                },
                total: { 
                    ...product.total,
                    taxes: await Promise.all(product.total.taxes.map(async tax => {
                        const t = await Mongo.Tax.findOne({uuid: tax.uuid}).lean();
                        return {
                            _id: t._id,
                            ...tax,
                            uuid: undefined
                        }
                    }))
                }
            }
        }))
    }
}

export async function invoiceViewer (invoice) {
    //currenct
    const currency = await Mongo.Currency.findById(invoice.currency).lean()
    if(!currency) return Provider.error(res, "invoice", "badParams")

    const taxes = [];
    await Promise.all(invoice.grossTaxes.map(async brut => {
        if(brut._id) {
            const tax = await Mongo.Tax.findById(brut._id).lean();
            taxes.push({
                ...brut,
                uuid: tax.uuid,
                _id: undefined
            })
        }
    }));

    const unproducts = [];
    await Promise.all(invoice.products.map(async init => {
        const fetch = await Mongo.Product.findById(init._id).lean();
        const product = !invoice.finalized && fetch.latestBlock
        ? await Mongo.Product.findById(fetch.latestBlock).lean()
        : fetch;
        const processed = await Provider.product.singleProductParser(product);

        unproducts.push({
            item: {...processed, quantity: init.quantity},
            product: {...processed}
        });
    }));

    const items = unproducts.map(p => p.item);
    const products = unproducts.map(p => p.product);

    const body = {
        number: invoice.number,
        uuid: invoice.uuid,
        currency: {
            isoSign: currency.isoSign,
            isoName: currency.isoName,
            uuid: currency.uuid,
        },
        taxes: taxes.map(t => t.uuid),
        taxesFull: taxes,
        items,
        products,
        customerDetails: invoice.customerDetails,
        user: (await Mongo.User.findById(invoice.user)).uuid,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        finalized: invoice.finalized,
        paid: invoice.paid,
        refunded: invoice.refunded,
        reduction: invoice?.reduction,
        notes: invoice?.notes,
        sums: {...invoice.sums, _id: undefined},
        // TODO
        customerDetails: invoice.customerDetails
    }

    return body;
}