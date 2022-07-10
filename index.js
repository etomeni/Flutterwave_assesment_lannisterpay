import express from 'express';

import bodyParser from 'body-parser';
import cors from 'cors';

import { get404 } from './controllers/error.js';
import { get500 } from './controllers/error.js';


const app = express();
const PORT = process.env.PORT || 5001;
app.use(bodyParser.json());
app.use(cors());

app.post('/split-payments/compute', (req, res) => {
    const SplitInfo = req.body.SplitInfo;
    let Balance = req.body.Amount;

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
})

app.use(get404);
app.use(get500);

app.listen(PORT, () => {
    console.log(`Server Running on port: http://localhost:${PORT}`);
})