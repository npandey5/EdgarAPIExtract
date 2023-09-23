EDGAR Data extraction

EDGAR API for filing:
https://data.sec.gov/submissions/CIK0000930667.json

Report Date: filings -> recent -> reportDate
Filter for N-Port: filings -> recent -> form

URL Breakdown:
https://www.sec.gov/Archives/edgar/data/930667/000175272423165795/0001752724-23-165795-index.htm

https://www.sec.gov/Archives/edgar/data/930667/000175272423165795/primary_doc.xml
https://www.sec.gov/Archives/edgar/data/<CIK>/<AccessionNumber>/primary_doc.xml

CIK - CIK0000930667 - Strip CIK and preceeding 0's
AccessionNumber - filings -> recent -> accessionNumber (e.g 0001752724-23-165795) remove '-'


Step 1 - Call API https://data.sec.gov/submissions/CIK0000930667.json (CIK can be made configurable)

Step 2 - Filter for all records that have "filings -> recent -> form" == N-Port

Step 3 - Find the AccessionNumber at the same index under "filings -> recent -> accessionNumber"

NOTE: There is rate limiting applicable only the SEC EDGAR APIs (10 requests per second). So the response times will be high.
