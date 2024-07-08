// routes/categoryItems.js
const express = require('express');
const Transaction = require('../models/transaction');

const router = express.Router();

router.get('/', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1, 2000`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const query = {
        dateOfSale: {
            $gte: new Date(startDate.getFullYear(), startDate.getMonth(), 1),
            $lt: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1)
        }
    };

    try {
        const categoryItems = await Transaction.aggregate([
            { $match: query },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $project: { _id: 0, category: '$_id', count: 1 } }
        ]);

        res.json(categoryItems);
    } catch (error) {
        res.status(500).send('Error fetching category items: ' + error.message);
    }
});

module.exports = router;
