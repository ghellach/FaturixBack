import Mongo from '../models/_main.js';
import Provider from './_main.js';

async function productProvider (uuid) {
    return await Mongo.Product.findOne({uuid}).lean();
}

async function taxProvider(uuid) {
    return await Mongo.Tax.findOne({uuid}).lean()
}

async function errorHandler(code) {
    if(code === "badParams") Provider.error(res, "invoice", "badParams");
    else return false;
    return false;
}

export async function invoiceModeller (res, initialProducts, initialTaxes) {

    /*
        takes in: res object, initial products and initial taxes
        needs: product provider with uuid and same for taxprovider
    */

    try {
        // taxes init
        let taxes = [];
        let taxesBody = [];
        let rejectT = false;
        await Promise.all(initialTaxes.map(async tax => {
            if(rejectT) return;
            const fetch = await taxProvider(tax);
            if(!fetch) {
                rejectP = true;
                return errorHandler("badParams");
            }else {
                taxes.push(fetch.uuid);
                taxesBody.push(fetch);
            }
        }));
        if(rejectT) return;

        // products fetch
        let rejectP = false;
        const products = await Promise.all(initialProducts.map(async (ident) => {
            // prevent crash by checking previous error
            if(rejectP) return;

            const product = await productProvider(ident.uuid);
            if(!product) {
                rejectP = true;
                return errorHandler("badParams");
            }

            // if(!ident.quantity || ident?.quantity > product.quantity) {
            //     rejectP = true;
            //     return Provider.error(res, "invoice", "quantityOverflow", {uuid: product.uuid});
            // }

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

        if(rejectP) return;

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

        const body = {
            sums: {
                taxesTotal: Number(taxesTotal).toFixed(2),
                subTotal: Number(subTotal).toFixed(2),
                grossTotal: Number(grossTotal).toFixed(2)
            },
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