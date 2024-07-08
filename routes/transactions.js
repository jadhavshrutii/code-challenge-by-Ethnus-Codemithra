// routes/transactions.js
const express = require('express');
const Transaction = require('../models/transaction');

const router = express.Router();

router.get('/', async (req, res) => {
    const { month, page = 1, perPage = 10, search = '' } = req.query;
    const startDate = new Date(`${month} 1, 2000`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const query = {
        dateOfSale: {
            $gte: new Date(startDate.getMonth() + 1 + '-01-' + startDate.getFullYear()),
            $lt: new Date(endDate.getMonth() + 1 + 1 + '-01-' + endDate.getFullYear())
        },
        $or: [
            { title: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { price: new RegExp(search, 'i') }
        ]
    };

    try {
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(Number(perPage));

        res.json(transactions);
    } catch (error) {
        res.status(500).send('Error fetching transactions: ' + error.message);
    }
});

module.exports = router;
