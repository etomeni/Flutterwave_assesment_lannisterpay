import express from 'express';

import bodyParser from 'body-parser';
import cors from 'cors';

import { get404, get500 } from './controllers/error.js';

const app = express();
const PORT = process.env.PORT || 5001;
app.use(bodyParser.json());
app.use(cors());

app.post('/split-payments/compute', (req, res, next) => {
    try {
        const SplitInfo = req.body.SplitInfo;
        let Balance = req.body.Amount;

        // Validations Start
        if (req.body.ID.length < 1 || isNaN(req.body.ID)) {
            return res.status(400).json({
                error: {
                    message:"ID invalid!(ID must be a number)"
                }
            });
        }

        if (req.body.Amount < 1 || isNaN(req.body.Amount)) {
            return res.status(400).json({
                error: {
                    message: "Amount invald! (only positive numbers, greater than 0 allowed)!"
                }
            });
        }

        if (SplitInfo.length < 1 || SplitInfo.length > 20) {
            return res.status(400).json({
                error: {
                    message: "length of SplitInfo is invalid! (requires a MINIMUM of 1 split entity and MAXIMUM of 20 entities)!"
                }
            });
        }

        if (`${req.body.Currency}`.trim().length < 1 || !req.body.Currency) {
            return res.status(400).json({
                error: {
                    message: "Currency Description invalid!"
                }
            });
        }

        if (`${req.body.CustomerEmail}`.trim().length < 1 || !req.body.CustomerEmail.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
            return res.status(400).json({
                error: {
                    message: "Email invalid"
                }
            });
        }
        // Validations End

        const response = {
            "ID": req.body.ID,
            "Balance": null,
            "SplitBreakdown": []
        }
    
        for (let i = 0; i < SplitInfo.length; i++) {
        
            if (SplitInfo[i].SplitType == "FLAT") {
                const splitResponse ={
                    "SplitEntityId": SplitInfo[i].SplitEntityId,
                    "Amount": SplitInfo[i].SplitValue
                };
    
                if (Balance < SplitInfo[i].SplitValue) {
                    splitResponse.Amount = Balance;
    
                    Balance -= Balance;
                } else {
                    Balance -= SplitInfo[i].SplitValue;
                }
    
                response.SplitBreakdown.push(splitResponse);
    
                SplitInfo.splice(i, 1); 
                i--; 
            }
        }
    
        for (let i = 0; i < SplitInfo.length; i++) {
            
            if (SplitInfo[i].SplitType == "PERCENTAGE") {
                const percentageAmount = (SplitInfo[i].SplitValue/100) * Balance;
    
                const splitResponse ={
                    "SplitEntityId": SplitInfo[i].SplitEntityId,
                    "Amount": percentageAmount
                };
    
                if (Balance < SplitInfo[i].SplitValue) {
                    splitResponse.Amount = Balance;
    
                    Balance -= Balance;
                } else {
                    Balance -= percentageAmount;
                }
    
                response.SplitBreakdown.push(splitResponse);
    
                SplitInfo.splice(i, 1); 
                i--; 
            }
        }
        
        let totalRatio = 0;
        const bal = Balance;
        for (let i = 0; i < SplitInfo.length; i++) {
    
            if (SplitInfo[i].SplitType == "RATIO") {
                totalRatio += SplitInfo[i].SplitValue;
            }
        }
    
        for (let i = 0; i < SplitInfo.length; i++) {
    
            if (SplitInfo[i].SplitType == "RATIO") {
                const ratioAmount = (SplitInfo[i].SplitValue/totalRatio) * bal;
    
                const splitResponse ={
                    "SplitEntityId": SplitInfo[i].SplitEntityId,
                    "Amount": ratioAmount
                };
    
                if (Balance < SplitInfo[i].SplitValue) {
                    splitResponse.Amount = Balance;
    
                    Balance -= Balance;
                } else {
                    Balance -= ratioAmount;
                }
    
                response.SplitBreakdown.push(splitResponse);
    
                SplitInfo.splice(i, 1);
                i--;
            }
        }
    
        response.Balance = Balance;
    
        return res.status(200).json(response);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
})

app.use(get404);
app.use(get500);

app.listen(PORT, () => {
    console.log(`Server Running on port: http://localhost:${PORT}`);
})