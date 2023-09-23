import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import { Parser } from 'xml2js';
import { fileURLToPath } from 'url'; // Import fileURLToPath function
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url); // Get the current file's path
const __dirname = dirname(__filename); // Get the directory name

const app = express();
const port = 8080;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "public" directory
//app.use(express.static('public'));

app.use(express.static(join(__dirname, 'public')));


app.get("/", (req, res) => {
    // Serve the index.html file
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Define a route to handle the primary_doc.xml request based on the response
app.get("/fetch-doc/:cik/:accessionNumber", async (req, res) => {
    const { cik, accessionNumber } = req.params;
    const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/primary_doc.xml`;
    console.log("Getting data for ", url);

    try {
        const response = await axios.get(url);

        const xmlData = response.data;

        const parser = new Parser({ explicitArray: false });
        parser.parseString(xmlData, (err, result) => {
            if (err) {
                console.error("Error parsing XML:", err);
                return res.status(500).json({ error: "Error parsing primary_doc.xml" });
            }

            console.log(result);

            const invstOrSecs = result.edgarSubmission.formData.invstOrSecs.invstOrSec || [];

            let finalResponse = {
                GenInfo: {
                    SeriesName: result.edgarSubmission.formData?.genInfo?.seriesName,
                    SeriesId: result.edgarSubmission.formData?.genInfo?.seriesId,
                    RepStartDate: result.edgarSubmission.formData?.genInfo?.repPdDate,
                    RepEndDate: result.edgarSubmission.formData?.genInfo?.repPdEnd,
                    TotalAssets: result.edgarSubmission.formData?.fundInfo?.totAssets,
                    TotalLiabilities: result.edgarSubmission.formData?.fundInfo?.totLiabs,
                    NetAssets: result.edgarSubmission.formData?.fundInfo?.netAssets,
                },
                Securities: invstOrSecs.map((invstOrSec) => {
                    let security = {
                        Name: invstOrSec.name,
                        LEI: invstOrSec.lei,
                        Title: invstOrSec.title,
                        Cusip: invstOrSec.cusip,
                        Value: invstOrSec.value,
                        ValueUSD: invstOrSec.valUSD,
                        Balance: invstOrSec.balance,
                        Units: invstOrSec.units,
                        Currency: invstOrSec.curCd,
                        ExchangeRt: invstOrSec.exchangeRt,
                        ValueUSD: invstOrSec.valUSD,
                        Percentage: invstOrSec.pctVal,
                        PayoffProfile: invstOrSec.payoffProfile,
                        AssetCategory: invstOrSec.assetCat,
                        IssuerCategory: invstOrSec.issuerCat,
                        InvCountry: invstOrSec.invCountry,
                        IsRestricted: invstOrSec.isRestrictedSec,
                        FairValueLevel: invstOrSec.fairValLevel
                    }

                    return security;

                }),
            };

            res.json(finalResponse);
        });
    } catch (error) {
        console.error("Error fetching primary_doc.xml:", error);
        res.status(500).json({ error: "Error fetching primary_doc.xml" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
