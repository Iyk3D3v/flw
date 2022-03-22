const router = require('express').Router();
const Fee = require('../models/fee-model');


//for base api
router.get("/", async (req, res)=>{
   return res.send("Lannister Pay API")
})

//to accept fee config
router.post("/fees", async (req,res)=>{
    try{
        //to parse fee structurre
        //considering rrequest always  has a fixed structure
        let data = req.body.FeeConfigurationSpec.split("\n");
        console.log(`data`,data);

        data.forEach(item =>{
           var b=  item.split(" ");
            console.log(b);
            let newFee = new Fee({
                feeId : b[0],
                //fill up the rest/
                feeCurrency : b[1],
                feeLocale : b[2],
                feeEntity : (b[3].split("(")[0]),
                entityProp: (b[3].split("(")[1]).slice(0,-1),
                feeType : b[6],
                feeValue : b[7]

            })
            console.log(`newfee`,newFee)

            const added = newFee.save();
        });
        //use the values of the splitted array to save to db

        return res.status(200).send({
         //   da:data,
            status: "ok"
        })


    }
    catch(err)
    {
        console.log(err.message)
        return res.status(400).send({error:"Error Occured"})
    }
})



//now to compute the fees
router.post("/compute-transaction-fee", async (req,res)=>{
    try{
        // now to compute fees
        let local = "LOCL";
        
        const fees = await Fee.find();

        // tocheck for currency not matching
      //  let chkCurr = fees.filter(p=>p.feeEntity == req.body.PaymentEntity.Type 

        //first eliminate if currency not matching
        if(req.body.Currency != "NGN")
        {
            return res.status(400).send({Error:`No fee configuration for ${req.body.Currency} transactions.`});
        }

        if(req.body.PaymentEntity.Country != req.body.CurrencyCountry)
        {
            local = "INTL";
        }

        //now for others, at this point all trans are locale
        if(req.body.PaymentEntity.Type == "CREDIT-CARD"){

            //get a list of fee config for credit-card and the same entity prop type //checking if entity prop is equals to brand 
            let payModel = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == req.body.PaymentEntity.Brand && p.feeLocale == local);
            if(payModel != null || payModel != undefined)
            {
                console.log(`here`,payModel)
                if(payModel.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel.feeType)
                    let amt = parseFloat(payModel.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel.feeType)

                    let amt = parseFloat(payModel.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :parseFloat(total),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType === 'PERC')
                {
                    console.log(`here`,payModel.feeType)
                    let amt = (parseFloat(payModel.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
               // return res.status(200).send({Data:payModel});

             //checking if entity prop is equals to issuer 
            let payModel2 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == local && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) );
            if(payModel2 != undefined || payModel2 != null)
            {
                console.log(`here`,payModel2)
                if(payModel2.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel2.feeType)
                    let amt = parseFloat(payModel2.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel2.feeType)

                    let amt = parseFloat(payModel2.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel2.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType === 'PERC')
                {
                    console.log(`here`,payModel2.feeType)
                    let amt = (parseFloat(payModel2.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
           
            let payModel5 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) )
            if(payModel5 != null || payModel5 != undefined)
            {   
                console.log(`here`,payModel5)
                if(payModel5.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel5.feeType)
                    let amt = parseFloat(payModel5.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel5.feeType)

                    let amt = parseFloat(payModel5.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel5.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :parseFloat(total),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType === 'PERC')
                {
                    console.log(`here`,payModel5.feeType)
                    let amt = (parseFloat(payModel5.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
            
            //checking if the entity prop is *
            let payModel1 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == '*'  && p.feeLocale == local)

            if(payModel1 != null || payModel1 != undefined)
            {
                console.log(`here1`,payModel1)
                if(payModel1.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel1.feeType)
                    let amt = parseFloat(payModel1.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel1.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel1.feeType)

                    let amt = parseFloat(payModel1.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel1.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel1.feeType === 'PERC')
                {
                    console.log(`here`,payModel1.feeType)
                    let amt = (parseFloat(payModel1.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }

            

            //checking if LOCAL/INTL is *
            let payModel4 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" )
            if(payModel4 != null || payModel4 != undefined)
            {
                console.log(`here1`,payModel4)
                if(payModel4.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel4.feeType)
                    let amt = parseFloat(payModel4.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel4.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel4.feeType)

                    let amt = parseFloat(payModel4.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel4.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel4.feeType === 'PERC')
                {
                    console.log(`here`,payModel4.feeType)
                    let amt = (parseFloat(payModel4.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }


            //to check if entity type is * and locale is * buh creditcard
            let payModel6 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && p.entityProp == '*'  )
            if(payModel6 != null || payModel6 != undefined)
            {
                console.log(`here1`,payModel6)
                if(payModel6.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel6.feeType)
                    let amt = parseFloat(payModel6.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel6.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel6.feeType)

                    let amt = parseFloat(payModel6.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel6.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel6.feeType === 'PERC')
                {
                    console.log(`here`,payModel6.feeType)
                    let amt = (parseFloat(payModel6.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }

             //to check if entity type is * and locale is * and alll *
             let payModel7 = fees.find(p=>p.feeEntity == "*" && p.feeLocale == "*" && p.entityProp == '*'  )
             if(payModel7 != null || payModel7 != undefined)
             {
                 console.log(`here1`,payModel7)
                 if(payModel7.feeType == "FLAT")
                 {
                     //do
                     console.log(`here`,payModel7.feeType)
                     let amt = parseFloat(payModel7.feeValue);
 
                     let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));
 
                     return res.status(200).send({
                         AppliedFeeID:payModel7.feeId,
                         AppliedFeeValue :amt,
                         ChargeAmount : chrgamt,
                         SettlementAmount : (chrgamt-amt)
                     });
                 }
 
                 else if(payModel7.feeType == "FLAT_PERC")
                 {
                     try{
                     console.log(`here`,payModel7.feeType)
 
                     let amt = parseFloat(payModel7.feeValue.split(":")[0]);
 
                     let amt1 = parseFloat(payModel7.feeValue.split(":")[1]);
 
                     let total = amt +((amt1/100)*parseFloat(req.body.Amount))
 
                     let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));
 
                     return res.status(200).send({
                         AppliedFeeID:payModel7.feeId,
                         AppliedFeeValue : total.toFixed(2),
                         ChargeAmount : chrgamt,
                         SettlementAmount : (chrgamt-total)
                     });
 
                     }
                     catch(err)
                     {
                         return res.status(400).send({error:err.message})
                     }
                     
                 }
 
                 else if(payModel7.feeType === 'PERC')
                 {
                     console.log(`here`,payModel7.feeType)
                     let amt = (parseFloat(payModel7.feeValue)/100)*(parseFloat(req.body.Amount));
 
                     let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));
 
                     return res.status(200).send({
                         AppliedFeeID:payModel7.feeId,
                         AppliedFeeValue :Number(amt.toFixed(2)),
                         ChargeAmount : chrgamt,
                         SettlementAmount : (chrgamt-amt)
                     });
 
                 }
             }

        //if all fsiles to match, return this
             return res.status(400).send({Error:"No fee configuration matches this payment"});

        }

        // then for debit card*************************************************
        if(req.body.PaymentEntity.Type == "DEBIT-CARD"){
            //get a list of fee config for credit-card and the same entity prop type //checking if entity prop is equals to brand 
            let payModel = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == req.body.PaymentEntity.Brand && p.feeLocale == local);
            if(payModel != null || payModel != undefined)
            {
                console.log(`here`,payModel)
                if(payModel.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel.feeType)
                    let amt = parseFloat(payModel.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel.feeType)

                    let amt = parseFloat(payModel.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType === 'PERC')
                {
                    console.log(`here`,payModel.feeType)
                    let amt = (parseFloat(payModel.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
               // return res.status(200).send({Data:payModel});
               
             //checking if entity prop is equals to issuer 
            let payModel2 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == local && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) );
            if(payModel2 != undefined || payModel2 != null)
            {
                console.log(`here`,payModel2)
                if(payModel2.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel2.feeType)
                    let amt = parseFloat(payModel2.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel2.feeType)

                    let amt = parseFloat(payModel2.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel2.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType === 'PERC')
                {
                    console.log(`here`,payModel2.feeType)
                    let amt = (parseFloat(payModel2.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
           
            let payModel5 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) )
            if(payModel5 != null || payModel5 != undefined)
            {   
                console.log(`here`,payModel5)
                if(payModel5.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel5.feeType)
                    let amt = parseFloat(payModel5.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel5.feeType)

                    let amt = parseFloat(payModel5.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel5.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType === 'PERC')
                {
                    console.log(`here`,payModel5.feeType)
                    let amt = (parseFloat(payModel5.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
            
            //checking if the entity prop is *
            let payModel1 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == '*'  && p.feeLocale == local)

            if(payModel1 != null || payModel1 != undefined)
            {
                console.log(`here1`,payModel1)
                if(payModel1.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel1.feeType)
                    let amt = parseFloat(payModel1.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel1.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel1.feeType)

                    let amt = parseFloat(payModel1.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel1.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel1.feeType === 'PERC')
                {
                    console.log(`here`,payModel1.feeType)
                    let amt = (parseFloat(payModel1.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }

            

            //checking if LOCAL/INTL is *
            let payModel4 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" )
            if(payModel4 != null || payModel4 != undefined)
            {
                console.log(`here1`,payModel4)
                if(payModel4.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel4.feeType)
                    let amt = parseFloat(payModel4.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel4.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel4.feeType)

                    let amt = parseFloat(payModel4.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel4.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel4.feeType === 'PERC')
                {
                    console.log(`here`,payModel4.feeType)
                    let amt = (parseFloat(payModel4.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }


            //to check if entity type is * and locale is * buh creditcard
            let payModel6 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && p.entityProp == '*'  )
            if(payModel6 != null || payModel6 != undefined)
            {
                console.log(`here1`,payModel6)
                if(payModel6.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel6.feeType)
                    let amt = parseFloat(payModel6.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel6.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel6.feeType)

                    let amt = parseFloat(payModel6.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel6.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel6.feeType === 'PERC')
                {
                    console.log(`here`,payModel6.feeType)
                    let amt = (parseFloat(payModel6.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }

   //to check if entity type is * and locale is * and alll *
   let payModel7 = fees.find(p=>p.feeEntity == "*" && p.feeLocale == "*" && p.entityProp == '*'  )
   if(payModel7 != null || payModel7 != undefined)
   {
       console.log(`here1`,payModel7)
       if(payModel7.feeType == "FLAT")
       {
           //do
           console.log(`here`,payModel7.feeType)
           let amt = parseFloat(payModel7.feeValue);

           let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

           return res.status(200).send({
               AppliedFeeID:payModel7.feeId,
               AppliedFeeValue :amt,
               ChargeAmount : chrgamt,
               SettlementAmount : (chrgamt-amt)
           });
       }

       else if(payModel7.feeType == "FLAT_PERC")
       {
           try{
           console.log(`here`,payModel7.feeType)

           let amt = parseFloat(payModel7.feeValue.split(":")[0]);

           let amt1 = parseFloat(payModel7.feeValue.split(":")[1]);

           let total = amt +((amt1/100)*parseFloat(req.body.Amount))

           let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

           return res.status(200).send({
               AppliedFeeID:payModel7.feeId,
               AppliedFeeValue : total.toFixed(2),
               ChargeAmount : chrgamt,
               SettlementAmount : (chrgamt-total)
           });

           }
           catch(err)
           {
               return res.status(400).send({error:err.message})
           }
           
       }

       else if(payModel7.feeType === 'PERC')
       {
           console.log(`here`,payModel7.feeType)
           let amt = (parseFloat(payModel7.feeValue)/100)*(parseFloat(req.body.Amount));

           let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

           return res.status(200).send({
               AppliedFeeID:payModel7.feeId,
               AppliedFeeValue :Number(amt.toFixed(2)),
               ChargeAmount : chrgamt,
               SettlementAmount : (chrgamt-amt)
           });

       }
   }

            return res.status(400).send({Error:"No fee configuration matches this payment"});

        }

        //then for bank acct *********************************************************
        if(req.body.PaymentEntity.Type == "BANK-ACCOUNT"){

            //get a list of fee config for credit-card and the same entity prop type //checking if entity prop is equals to brand 
            let payModel = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == req.body.PaymentEntity.Brand && p.feeLocale == local);
            if(payModel != null || payModel != undefined)
            {
                console.log(`here`,payModel)
                if(payModel.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel.feeType)
                    let amt = parseFloat(payModel.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel.feeType)

                    let amt = parseFloat(payModel.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType === 'PERC')
                {
                    console.log(`here`,payModel.feeType)
                    let amt = (parseFloat(payModel.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
               // return res.status(200).send({Data:payModel});
               
             //checking if entity prop is equals to issuer 
            let payModel2 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == local && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) );
            if(payModel2 != undefined || payModel2 != null)
            {
                console.log(`here`,payModel2)
                if(payModel2.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel2.feeType)
                    let amt = parseFloat(payModel2.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel2.feeType)

                    let amt = parseFloat(payModel2.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel2.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType === 'PERC')
                {
                    console.log(`here`,payModel2.feeType)
                    let amt = (parseFloat(payModel2.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
           
            let payModel5 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) )
            if(payModel5 != null || payModel5 != undefined)
            {   
                console.log(`here`,payModel5)
                if(payModel5.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel5.feeType)
                    let amt = parseFloat(payModel5.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel5.feeType)

                    let amt = parseFloat(payModel5.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel5.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType === 'PERC')
                {
                    console.log(`here`,payModel5.feeType)
                    let amt = (parseFloat(payModel5.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
            
            //checking if the entity prop is *
            let payModel1 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == '*'  && p.feeLocale == local)

            if(payModel1 != null || payModel1 != undefined)
            {
                console.log(`here1`,payModel1)
                if(payModel1.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel1.feeType)
                    let amt = parseFloat(payModel1.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel1.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel1.feeType)

                    let amt = parseFloat(payModel1.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel1.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel1.feeType === 'PERC')
                {
                    console.log(`here`,payModel1.feeType)
                    let amt = (parseFloat(payModel1.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }

            

            //checking if LOCAL/INTL is *
            let payModel4 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" )
            if(payModel4 != null || payModel4 != undefined)
            {
                console.log(`here1`,payModel4)
                if(payModel4.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel4.feeType)
                    let amt = parseFloat(payModel4.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel4.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel4.feeType)

                    let amt = parseFloat(payModel4.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel4.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel4.feeType === 'PERC')
                {
                    console.log(`here`,payModel4.feeType)
                    let amt = (parseFloat(payModel4.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }


            //to check if entity type is * and locale is * buh creditcard
            let payModel6 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && p.entityProp == '*'  )
            if(payModel6 != null || payModel6 != undefined)
            {
                console.log(`here1`,payModel6)
                if(payModel6.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel6.feeType)
                    let amt = parseFloat(payModel6.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel6.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel6.feeType)

                    let amt = parseFloat(payModel6.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel6.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel6.feeType === 'PERC')
                {
                    console.log(`here`,payModel6.feeType)
                    let amt = (parseFloat(payModel6.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }

               //to check if entity type is * and locale is * and alll *
               let payModel7 = fees.find(p=>p.feeEntity == "*" && p.feeLocale == "*" && p.entityProp == '*'  )
               if(payModel7 != null || payModel7 != undefined)
               {
                   console.log(`here1`,payModel7)
                   if(payModel7.feeType == "FLAT")
                   {
                       //do
                       console.log(`here`,payModel7.feeType)
                       let amt = parseFloat(payModel7.feeValue);
   
                       let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));
   
                       return res.status(200).send({
                           AppliedFeeID:payModel7.feeId,
                           AppliedFeeValue :amt,
                           ChargeAmount : chrgamt,
                           SettlementAmount : (chrgamt-amt)
                       });
                   }
   
                   else if(payModel7.feeType == "FLAT_PERC")
                   {
                       try{
                       console.log(`here`,payModel7.feeType)
   
                       let amt = parseFloat(payModel7.feeValue.split(":")[0]);
   
                       let amt1 = parseFloat(payModel7.feeValue.split(":")[1]);
   
                       let total = amt +((amt1/100)*parseFloat(req.body.Amount))
   
                       let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));
   
                       return res.status(200).send({
                           AppliedFeeID:payModel7.feeId,
                           AppliedFeeValue : total.toFixed(2),
                           ChargeAmount : chrgamt,
                           SettlementAmount : (chrgamt-total)
                       });
   
                       }
                       catch(err)
                       {
                           return res.status(400).send({error:err.message})
                       }
                       
                   }
   
                   else if(payModel7.feeType === 'PERC')
                   {
                       console.log(`here`,payModel7.feeType)
                       let amt = (parseFloat(payModel7.feeValue)/100)*(parseFloat(req.body.Amount));
   
                       let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));
   
                       return res.status(200).send({
                           AppliedFeeID:payModel7.feeId,
                           AppliedFeeValue :Number(amt.toFixed(2)),
                           ChargeAmount : chrgamt,
                           SettlementAmount : (chrgamt-amt)
                       });
   
                   }
               }


            return res.status(400).send({Error:"No fee configuration matches this payment"});
        }


        //then for wallets ************************************************************8
        if(req.body.PaymentEntity.Type == "WALLET-ID"){

            //get a list of fee config for credit-card and the same entity prop type //checking if entity prop is equals to brand 
            let payModel = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == req.body.PaymentEntity.Brand && p.feeLocale == local);
            if(payModel != null || payModel != undefined)
            {
                console.log(`here`,payModel)
                if(payModel.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel.feeType)
                    let amt = parseFloat(payModel.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel.feeType)

                    let amt = parseFloat(payModel.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType === 'PERC')
                {
                    console.log(`here`,payModel.feeType)
                    let amt = (parseFloat(payModel.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
               // return res.status(200).send({Data:payModel});
               
             //checking if entity prop is equals to issuer 
            let payModel2 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == local && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) );
            if(payModel2 != undefined || payModel2 != null)
            {
                console.log(`here`,payModel2)
                if(payModel2.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel2.feeType)
                    let amt = parseFloat(payModel2.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel2.feeType)

                    let amt = parseFloat(payModel2.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel2.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType === 'PERC')
                {
                    console.log(`here`,payModel2.feeType)
                    let amt = (parseFloat(payModel2.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
           
            let payModel5 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) )
            if(payModel5 != null || payModel5 != undefined)
            {   
                console.log(`here`,payModel5)
                if(payModel5.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel5.feeType)
                    let amt = parseFloat(payModel5.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel5.feeType)

                    let amt = parseFloat(payModel5.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel5.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType === 'PERC')
                {
                    console.log(`here`,payModel5.feeType)
                    let amt = (parseFloat(payModel5.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
            
            //checking if the entity prop is *
            let payModel1 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == '*'  && p.feeLocale == local)

            if(payModel1 != null || payModel1 != undefined)
            {
                console.log(`here1`,payModel1)
                if(payModel1.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel1.feeType)
                    let amt = parseFloat(payModel1.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel1.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel1.feeType)

                    let amt = parseFloat(payModel1.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel1.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel1.feeType === 'PERC')
                {
                    console.log(`here`,payModel1.feeType)
                    let amt = (parseFloat(payModel1.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }

            

            //checking if LOCAL/INTL is *
            let payModel4 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" )
            if(payModel4 != null || payModel4 != undefined)
            {
                console.log(`here1`,payModel4)
                if(payModel4.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel4.feeType)
                    let amt = parseFloat(payModel4.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel4.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel4.feeType)

                    let amt = parseFloat(payModel4.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel4.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel4.feeType === 'PERC')
                {
                    console.log(`here`,payModel4.feeType)
                    let amt = (parseFloat(payModel4.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }


            //to check if entity type is * and locale is * buh creditcard
            let payModel6 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && p.entityProp == '*'  )
            if(payModel6 != null || payModel6 != undefined)
            {
                console.log(`here1`,payModel6)
                if(payModel6.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel6.feeType)
                    let amt = parseFloat(payModel6.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel6.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel6.feeType)

                    let amt = parseFloat(payModel6.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel6.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel6.feeType === 'PERC')
                {
                    console.log(`here`,payModel6.feeType)
                    let amt = (parseFloat(payModel6.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }


               //to check if entity type is * and locale is * and alll *
               let payModel7 = fees.find(p=>p.feeEntity == "*" && p.feeLocale == "*" && p.entityProp == '*'  )
               if(payModel7 != null || payModel7 != undefined)
               {
                   console.log(`here1`,payModel7)
                   if(payModel7.feeType == "FLAT")
                   {
                       //do
                       console.log(`here`,payModel7.feeType)
                       let amt = parseFloat(payModel7.feeValue);
   
                       let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));
   
                       return res.status(200).send({
                           AppliedFeeID:payModel7.feeId,
                           AppliedFeeValue :amt,
                           ChargeAmount : chrgamt,
                           SettlementAmount : (chrgamt-amt)
                       });
                   }
   
                   else if(payModel7.feeType == "FLAT_PERC")
                   {
                       try{
                       console.log(`here`,payModel7.feeType)
   
                       let amt = parseFloat(payModel7.feeValue.split(":")[0]);
   
                       let amt1 = parseFloat(payModel7.feeValue.split(":")[1]);
   
                       let total = amt +((amt1/100)*parseFloat(req.body.Amount))
   
                       let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));
   
                       return res.status(200).send({
                           AppliedFeeID:payModel7.feeId,
                           AppliedFeeValue : total.toFixed(2),
                           ChargeAmount : chrgamt,
                           SettlementAmount : (chrgamt-total)
                       });
   
                       }
                       catch(err)
                       {
                           return res.status(400).send({error:err.message})
                       }
                       
                   }
   
                   else if(payModel7.feeType === 'PERC')
                   {
                       console.log(`here`,payModel7.feeType)
                       let amt = (parseFloat(payModel7.feeValue)/100)*(parseFloat(req.body.Amount));
   
                       let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));
   
                       return res.status(200).send({
                           AppliedFeeID:payModel7.feeId,
                           AppliedFeeValue :Number(amt.toFixed(2)),
                           ChargeAmount : chrgamt,
                           SettlementAmount : (chrgamt-amt)
                       });
   
                   }
               }
            return res.status(400).send({Error:"No fee configuration matches this payment"});
        }


        // then for ussd ********************************************88
        if(req.body.PaymentEntity.Type == "USSD"){

            //get a list of fee config for credit-card and the same entity prop type //checking if entity prop is equals to brand 
            let payModel = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == req.body.PaymentEntity.Brand && p.feeLocale == local);
            if(payModel != null || payModel != undefined)
            {
                console.log(`here`,payModel)
                if(payModel.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel.feeType)
                    let amt = parseFloat(payModel.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel.feeType)

                    let amt = parseFloat(payModel.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel.feeType === 'PERC')
                {
                    console.log(`here`,payModel.feeType)
                    let amt = (parseFloat(payModel.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
               // return res.status(200).send({Data:payModel});
               
             //checking if entity prop is equals to issuer 
            let payModel2 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == local && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) );
            if(payModel2 != undefined || payModel2 != null)
            {
                console.log(`here`,payModel2)
                if(payModel2.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel2.feeType)
                    let amt = parseFloat(payModel2.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel2.feeType)

                    let amt = parseFloat(payModel2.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel2.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel2.feeType === 'PERC')
                {
                    console.log(`here`,payModel2.feeType)
                    let amt = (parseFloat(payModel2.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel2.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
           
            let payModel5 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && (p.entityProp == req.body.PaymentEntity.Issuer || p.entityProp == req.body.PaymentEntity.ID || p.entityProp == req.body.PaymentEntity.Number || p.entityProp == req.body.PaymentEntity.SixID) )
            if(payModel5 != null || payModel5 != undefined)
            {   
                console.log(`here`,payModel5)
                if(payModel5.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel5.feeType)
                    let amt = parseFloat(payModel5.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,    
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType == "FLAT_PERC")
                {
                    console.log(`here`,payModel5.feeType)

                    let amt = parseFloat(payModel5.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel5.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :total,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel5.feeType === 'PERC')
                {
                    console.log(`here`,payModel5.feeType)
                    let amt = (parseFloat(payModel5.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel5.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }
            
            //checking if the entity prop is *
            let payModel1 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.entityProp == '*'  && p.feeLocale == local)

            if(payModel1 != null || payModel1 != undefined)
            {
                console.log(`here1`,payModel1)
                if(payModel1.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel1.feeType)
                    let amt = parseFloat(payModel1.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel1.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel1.feeType)

                    let amt = parseFloat(payModel1.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel1.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel1.feeType === 'PERC')
                {
                    console.log(`here`,payModel1.feeType)
                    let amt = (parseFloat(payModel1.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel1.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }

            

            //checking if LOCAL/INTL is *
            let payModel4 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" )
            if(payModel4 != null || payModel4 != undefined)
            {
                console.log(`here1`,payModel4)
                if(payModel4.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel4.feeType)
                    let amt = parseFloat(payModel4.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel4.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel4.feeType)

                    let amt = parseFloat(payModel4.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel4.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel4.feeType === 'PERC')
                {
                    console.log(`here`,payModel4.feeType)
                    let amt = (parseFloat(payModel4.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel4.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }


            //to check if entity type is * and locale is * buh creditcard
            let payModel6 = fees.find(p=>p.feeEntity == req.body.PaymentEntity.Type && p.feeLocale == "*" && p.entityProp == '*'  )
            if(payModel6 != null || payModel6 != undefined)
            {
                console.log(`here1`,payModel6)
                if(payModel6.feeType == "FLAT")
                {
                    //do
                    console.log(`here`,payModel6.feeType)
                    let amt = parseFloat(payModel6.feeValue);

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :amt,
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });
                }

                else if(payModel6.feeType == "FLAT_PERC")
                {
                    try{
                    console.log(`here`,payModel6.feeType)

                    let amt = parseFloat(payModel6.feeValue.split(":")[0]);

                    let amt1 = parseFloat(payModel6.feeValue.split(":")[1]);

                    let total = amt +((amt1/100)*parseFloat(req.body.Amount))

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue : total.toFixed(2),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-total)
                    });

                    }
                    catch(err)
                    {
                        return res.status(400).send({error:err.message})
                    }
                    
                }

                else if(payModel6.feeType === 'PERC')
                {
                    console.log(`here`,payModel6.feeType)
                    let amt = (parseFloat(payModel6.feeValue)/100)*(parseFloat(req.body.Amount));

                    let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));

                    return res.status(200).send({
                        AppliedFeeID:payModel6.feeId,
                        AppliedFeeValue :Number(amt.toFixed(2)),
                        ChargeAmount : chrgamt,
                        SettlementAmount : (chrgamt-amt)
                    });

                }
            }

               //to check if entity type is * and locale is * and alll *
               let payModel7 = fees.find(p=>p.feeEntity == "*" && p.feeLocale == "*" && p.entityProp == '*'  )
               if(payModel7 != null || payModel7 != undefined)
               {
                   console.log(`here1`,payModel7)
                   if(payModel7.feeType == "FLAT")
                   {
                       //do
                       console.log(`here`,payModel7.feeType)
                       let amt = parseFloat(payModel7.feeValue);
   
                       let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));
   
                       return res.status(200).send({
                           AppliedFeeID:payModel7.feeId,
                           AppliedFeeValue :amt,
                           ChargeAmount : chrgamt,
                           SettlementAmount : (chrgamt-amt)
                       });
                   }
   
                   else if(payModel7.feeType == "FLAT_PERC")
                   {
                       try{
                       console.log(`here`,payModel7.feeType)
   
                       let amt = parseFloat(payModel7.feeValue.split(":")[0]);
   
                       let amt1 = parseFloat(payModel7.feeValue.split(":")[1]);
   
                       let total = amt +((amt1/100)*parseFloat(req.body.Amount))
   
                       let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + total ) : (parseFloat(req.body.Amount));
   
                       return res.status(200).send({
                           AppliedFeeID:payModel7.feeId,
                           AppliedFeeValue : total.toFixed(2),
                           ChargeAmount : chrgamt,
                           SettlementAmount : (chrgamt-total)
                       });
   
                       }
                       catch(err)
                       {
                           return res.status(400).send({error:err.message})
                       }
                       
                   }
   
                   else if(payModel7.feeType === 'PERC')
                   {
                       console.log(`here`,payModel7.feeType)
                       let amt = (parseFloat(payModel7.feeValue)/100)*(parseFloat(req.body.Amount));
   
                       let chrgamt = req.body.Customer.BearsFee == true ? (parseFloat(req.body.Amount) + amt ) : (parseFloat(req.body.Amount));
   
                       return res.status(200).send({
                           AppliedFeeID:payModel7.feeId,
                           AppliedFeeValue :Number(amt.toFixed(2)),
                           ChargeAmount : chrgamt,
                           SettlementAmount : (chrgamt-amt)
                       });
   
                   }
               }

            return res.status(400).send({Error:"No fee configuration matches this payment"});
        }

    }
    catch(err)
    {
        console.log(err.message)
        return res.status(400).send({error:"Error Occured"})
    }
})

module.exports = router;