const invoice = {
    products: [
        {},
        {},
        {
            uuid: uuid,
            quantity: quantity,
            price: price
        }
    ],
    currency: currencyUuid,
    taxes: [
        tpsUUID, tvqUUID 
    ],
    customerDetails: {
        phone: phone,
        email: email
    },
    reduction: {
        type: rate || amount
    }
}