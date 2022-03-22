const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({

    feeId: { type: String, required: true },
    feeCurrency: { type: String, required: true },
    feeLocale: { type: String, required: true },
    feeEntity: { type: String, required: true },
    entityProp: { type: String, required: true },
    feeType: { type: String, required: true },
    feeValue: { type: String, required: true },
},
{
    timestamps : true
})

module.exports = mongoose.model("fee", feeSchema);