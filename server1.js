const fs = require('fs');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3001;

// MongoDB connection URI
const MONGODB_URI = "mongodb+srv://bhagyabijlaney:pass123@cluster0.xesty4x.mongodb.net/";
const DATABASE_NAME = "BloodBank";
const COLLECTION_NAME = "inventory";

const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB Atlas
let db;
let collection;
let accessCollection;

const connectToMongoDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB');
        await client.connect();
        console.log('Connected to MongoDB');
        
        db = client.db(DATABASE_NAME);
        collection = db.collection(COLLECTION_NAME);
        
        // Connect to the "access" collection
        accessCollection = db.collection("access");
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        throw err;
    }
};

// Call the async function to connect to MongoDB
connectToMongoDB()
    .then(() => {
        // Start the server after successful MongoDB connection
        const port = process.env.PORT || 3001;
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Failed to start server:', err);
    });



// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Routes

// Mutual exclusion
app.get('/check-access', async (req, res) => {
    try {
        // Fetch the threadId from the "access" collection
        const accessDoc = await accessCollection.findOne();
        const threadId = accessDoc ? accessDoc.threadId : null;
        res.json({ threadId });
    } catch (err) {
        console.error('Error fetching access data from MongoDB:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/grant-access', async (req, res) => { 
    const { threadId } = req.body;
    console.log(threadId);  
    try {
        // Update the threadId in the "access" collection
        await accessCollection.updateOne({}, { $set: { threadId } }, { upsert: true });
        res.json({ threadId });
    } catch (err) {
        console.error('Error updating access data in MongoDB:', err);
        res.status(500).send('Internal Server Error');
    }
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
app.get('/api/inventory', async (req, res) => {
    try {
        const inventory = await collection.find().toArray();
        res.json({ inventory });
    } catch (err) {
        console.error('Error fetching inventory data from MongoDB:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Add inventory
app.post('/api/inventory/add', async (req, res) => {
    const { bloodGroup, quantity } = req.body;
    const newItem = { bloodGroup, quantity };
    try {
        const result = await collection.insertOne(newItem);
        res.json(result.ops[0]);
    } catch (err) {
        console.error('Error adding inventory to MongoDB:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update inventory
app.post('/api/inventory/update', async (req, res) => {
    const { bloodGroup, quantity } = req.body;
    try {
        const result = await collection.updateOne({ bloodGroup }, { $set: { quantity } });
        res.json(result.modifiedCount > 0 ? { bloodGroup, quantity } : null);
    } catch (err) {
        console.error('Error updating inventory in MongoDB:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete inventory
app.post('/api/inventory/delete', async (req, res) => {
    const { bloodGroup } = req.body;
    try {
        const result = await collection.deleteOne({ bloodGroup });
        res.json(result.deletedCount > 0);
    } catch (err) {
        console.error('Error deleting inventory from MongoDB:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
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

// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });
