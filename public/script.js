import axios from 'https://esm.sh/axios';
import { Workbook } from 'https://esm.sh/exceljs';

document.addEventListener("DOMContentLoaded", () => {
    const fetchDataButton = document.getElementById("fetchData");
    const cikNumbersTextarea = document.getElementById("cikNumbers");
    const resultDiv = document.getElementById("result");

    fetchDataButton.addEventListener("click", async () => {
        const cikNumbers = cikNumbersTextarea.value.split(/\n|,/).map((cik) => cik.trim());

        for (const cikNumber of cikNumbers) {
            if (!cikNumber) continue;

            try {
                const response = await axios.get(`https://data.sec.gov/submissions/${cikNumber}.json`, {
                    headers: {
                        'User-Agent': 'zensky@hyperdeveloper.com' // Add your custom User-Agent header here
                    }
                });

                //console.log(response);

                resultDiv.innerHTML += `Processing Records, please wait`;

                //const recentFilings = response.data?.filings?.recent || [];

                // Filter Accession Numbers that are N-PORT filings
                //let eligibleCIKs = response.filter(x => x?.filings?.recent?.form === "NPORT-P");

                const access = JSON.parse(JSON.stringify(response.data?.filings.recent.accessionNumber).replaceAll('-', ''));
                const cikForAPI = JSON.parse(JSON.stringify(response.data?.cik));

                let nport = response.data?.filings?.recent?.form;
                let eligibleCIKs = [...nport.keys()].filter(i => nport[i] === 'NPORT-P').map(j => access[j]);
                //const eligibleCIKs = recentFilings.filter(filing => filing.form === 'NPORT-P').map(filing => filing.accessionNumber.replaceAll('-', ''));


                console.log(eligibleCIKs);

                //let dataResponse = [];

                //TODO: Remove after testing
                const limitedCIKs = eligibleCIKs.slice(0, 50);

                //TODO: Uncomment the eligibleCIKs line after testing
                //const dataResponsePromises = eligibleCIKs.map(accessionNumber => axios.get(`/fetch-doc/${cikForAPI}/${accessionNumber}`));

                //Added Rate limiting to the application:
                const urls = limitedCIKs.map(accessionNumber => `/fetch-doc/${cikForAPI}/${accessionNumber}`);
                //const urls = eligibleCIKs.map(accessionNumber => `/fetch-doc/${cikForAPI}/${accessionNumber}`);
                const dataResponses = await fetchWithRateLimit(urls, 8);

                //Code without Rate Limiting
                //const dataResponsePromises = limitedCIKs.map(accessionNumber => axios.get(`/fetch-doc/${cikForAPI}/${accessionNumber}`));
                //const dataResponses = await Promise.all(dataResponsePromises);

                generateExcel(cikNumber, dataResponses.map(res => res.data));
                resultDiv.innerHTML += `<p>File downloaded for CIK: ${cikNumber}</p>`;

                // eligibleCIKs.forEach(element => {
                //     let securityData = axios.get(`/fetch-doc/${cikNumber}/${element.access}`);
                //     console.log({ securityData });
                //     dataResponse.push(securityData);
                // });

                // Call the function to parse JSON response and fetch primary_doc.xml
                // Add your logic here
            } catch (error) {
                console.error("Error fetching data:", error);
                resultDiv.innerHTML += `<p>Error fetching data for CIK: ${cikNumber}</p>`;
            }
        }
    });

    // // Function to generate Excel
    // function generateExcel(cikNumber, data) {
    //     const workbook = new Workbook();
    //     const worksheet = workbook.addWorksheet('Data');

    //     // Assuming that data is an array of objects, you need to specify which properties to include in the Excel sheet.
    //     // Here's an example of how you can create a simple Excel sheet with data:

    //     // Add headers to the worksheet
    //     worksheet.addRow(["Column1", "Column2", "Column3"]); // Replace with your column headers

    //     // Add data rows
    //     data.forEach((item) => {
    //         worksheet.addRow([item.property1, item.property2, item.property3]); // Replace with the properties you want to include
    //     });

    //     // Save the workbook
    //     workbook.xlsx.writeBuffer().then((buffer) => {
    //         const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    //         const url = window.URL.createObjectURL(blob);
    //         const a = document.createElement('a');
    //         a.href = url;
    //         a.download = `${cikNumber}.xlsx`;
    //         a.click();
    //         window.URL.revokeObjectURL(url);
    //     });
    // }

    async function fetchWithRateLimit(urls, maxRequestsPerSecond) {
        const results = [];
        const interval = 1000 / maxRequestsPerSecond; // Calculate the interval in milliseconds

        for (let i = 0; i < urls.length; i++) {
            const result = await axios.get(urls[i]);
            results.push(result);

            // If it's not the last request, wait for the interval before the next request
            if (i !== urls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }

        return results;
    }

    function generateExcel(cikNumber, dataResponses) {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Data');

        // Extract headers from the GenInfo and Securities sections of the finalResponse object
        const genInfoHeaders = Object.keys(dataResponses[0].GenInfo);
        const securitiesHeaders = Object.keys(dataResponses[0].Securities[0]);

        // Combine the headers and add them to the worksheet
        const allHeaders = [...genInfoHeaders, ...securitiesHeaders];
        worksheet.addRow(allHeaders);

        // Iterate over each dataResponse to populate the rows
        dataResponses.forEach(response => {
            const genInfoValues = Object.values(response.GenInfo);

            // For each security in the Securities section, create a new row
            response.Securities.forEach(security => {
                const securityValues = Object.values(security);
                const combinedValues = [...genInfoValues, ...securityValues];
                worksheet.addRow(combinedValues);
            });
        });

        // Save the workbook
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cikNumber}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

});
