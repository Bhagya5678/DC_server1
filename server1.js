// server.js
const fs = require('fs'); // Import the fs module
const os = require('os'); // Import the os module
const cors = require('cors'); // Import CORS middleware
const express = require('express');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');
const app = express();
const { v4: uuidv4 } = require('uuid');

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

const serverNumber = 1;

// Routes
//Mutual exclusion
let exclusiveThreadId = null;
app.get('/check-access', (req, res) => {
res.json({ threadId: exclusiveThreadId });
})

app.post('/grant-access', (req, res) => { 
    const {threadId} = req.body;
    console.log(threadId);  
    exclusiveThreadId = threadId; // Grant exclusive access to the client with the provided threadId
    res.json({ threadId: exclusiveThreadId });
});

app.get('/init-thread', (req, res) => {
    const threadId = uuidv4();
    res.cookie('threadId', threadId);
    res.json({ threadId });
});

app.get('/api/time', (req, res) => {
res.json({ time: new Date().toISOString() });
});

// Route to fetch inventory data
app.get('/api/inventory', (req, res) => {
    try {
    // Read inventory data from the file
    const inventoryData = fs.readFileSync('inventory.txt', 'utf8');
      // Parse the JSON data
        const inventory = JSON.parse(inventoryData);
    // Send the inventory data as response
    res.json({inventory, serverNumber});
    } catch (err) {
    console.error('Error reading inventory file:', err);
    res.status(500).send('Internal Server Error');
    }
});

// Add inventory
app.post('/api/inventory/add', (req, res) => {
const {protocol, bloodGroup, quantity} = req.body;
const newItem = {bloodGroup, quantity};
const options = {
    scriptPath: `./protocols/${protocol}`, // Path to the protocol-specific Python script
    args: ['addInventory', JSON.stringify(newItem)]
};
runPythonScript(protocol, options, (error, result) => {
        if (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(result);
        }
    });
});

// Update inventory
app.post('/api/inventory/update', (req, res) => {
const { protocol, bloodGroup, quantity} = req.body;
const newItem = {bloodGroup, quantity};

// Call the runPythonScript function with method name and arguments
const options = {
    scriptPath: `./protocols/${protocol}`, // Path to the protocol-specific Python script
    args: ['updateInventory', JSON.stringify(newItem)]
};

runPythonScript(protocol, options, (error, result) => {
    if (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    } else {
    res.json(result);
    }
});
});


// Delete inventory
app.post('/api/inventory/delete', (req, res) => {
const {protocol, bloodGroup} = req.body;
const options = {
    scriptPath: `./protocols/${protocol}`, // Path to the protocol-specific Python script
    args: ['deleteInventory', bloodGroup]
};

runPythonScript(protocol, options, (error, result) => {
    if (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    } else {
    res.json(result);
    }
});
});


// Helper function to run Python scripts
const runPythonScript = (protocol, options, res) => {
PythonShell.run(`${protocol}_script.py`, options, (err, result) => {
    if (err) {
    console.error('Error executing Python script:', err);
    res.status(500).send('Internal Server Error');
    } else {
    res.json(result);
    }
});
};

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
