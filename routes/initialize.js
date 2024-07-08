// routes/initialize.js
const express = require('express');
const axios = require('axios');
const Transaction = require('../models/transaction');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        // Clear existing data
        await Transaction.deleteMany({});

        // Insert new data
        await Transaction.insertMany(transactions);

        res.status(200).send('Database initialized with seed data.');
    } catch (error) {
        res.status(500).send('Error initializing database: ' + error.message);
    }
});

module.exports = router;
