const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Define the URL for the POST request
const url = 'https://bisesahiwal.edu.pk/allresult/route.php'; // Replace with your specific route

// Define the parameters for the POST request
const classParam = 2;
const yearParam = 2024;
const sessParam = 2;
const commitParam = 'GET RESULT';

// Define the target values for comparison
const targetName = 'Hassan Tariq'; // Replace with the name you are looking for
const targetFatherName = 'Father Name'; // Replace with the father's name you are looking for


let startRno = 100001
// let matchFound = false;
// Array to store found results
let results = [];

// Function to fetch data for a specific roll number
async function fetchData(rno) {
    try {
        const response = await axios.post(url, new URLSearchParams({
            class: classParam,
            year: yearParam,
            sess: sessParam,
            rno: rno,
            commit: commitParam
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Load the HTML into cheerio
        const $ = cheerio.load(response.data);
        
        // Check for "STATUS NOT FOUND" message
        const statusNotFound = $('div').filter((i, el) => {
            return $(el).text().includes('STATUS NOT FOUND');
        }).length > 0;

        if (statusNotFound) {
            console.log(`Roll Number: ${rno} - STATUS NOT FOUND, skipping to next.`);
            return false; // Skip to the next roll number
        }

        // Find the table with the specific style attribute
        const table = $('table[style="width: 100%;margin-bottom: 20px;"]'); // Select the table with the specified style
        
        if (table.length) {
            // Get the tbody and then the first two rows
            const tbody = table.find('tbody');
            const nameRow = tbody.find('tr').eq(0); // First row for Name
            const fatherNameRow = tbody.find('tr').eq(1); // Second row for Father's Name
            
            // Extract the name and father's name
            const nameCell = nameRow.find('td').eq(1).text().trim(); // Get the second cell of the first row
            const fatherNameCell = fatherNameRow.find('td').eq(1).text().trim(); // Get the second cell of the second row
            
            console.log(`Roll Number: ${rno}, Name: ${nameCell}, Father's Name: ${fatherNameCell}`);
            // Log the found values only if both name and father's name match the target values
            if (nameCell === targetName && fatherNameCell === targetFatherName) {
                console.log(`Match Found! Roll Number: ${rno}, Name: ${nameCell}, Father's Name: ${fatherNameCell}`);
                return true; // Match found
            }
            // Store the result in the results array
            results.push({
                rollNumber: rno,
                name: nameCell,
                fatherName: fatherNameCell
            });
        }
    } catch (error) {
        console.error(`Error for Roll Number ${rno}: ${error.message}`);
    }
    return false; // No match found
}
// fetchData(101151)

// Function to save results to a JSON file
function saveResultsToFile() {
    fs.writeFile('./results.json', JSON.stringify(results, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Results saved to results.json');
        }
    });
}


// Loop to make requests for roll numbers from 100001 to 108140
async function loopRequests() {
    for (let rno = startRno; rno <= 108140; rno++) {
        matchFound = await fetchData(rno);
        
        // If a match is found, break the loop
        if (matchFound) {
            console.log("Match found, breaking the loop.");
            break;
        }

        // Save results to file after every 10 roll numbers
        if ((rno - startRno + 1) % 10 === 0) {
            console.log('Saving results...');
            saveResultsToFile();
        }

        // Optional: Add a delay between requests to avoid overwhelming the server
        // await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
    // Save any remaining results to file after all requests are done
    if (results.length > 0) {
        saveResultsToFile();
    }
}

loopRequests();
