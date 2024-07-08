// routes/statistics.js
const express = require('express');
const Transaction = require('../models/transaction');

const router = express.Router();

router.get('/', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1, 2000`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const query = {
        dateOfSale: {
            $gte: new Date(startDate.getMonth() + 1 + '-01-' + startDate.getFullYear()),
            $lt: new Date(endDate.getMonth() + 1 + 1 + '-01-' + endDate.getFullYear())
        }
    };

    try {
        const totalSale = await Transaction.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);

        const totalSoldItems = await Transaction.countDocuments({ ...query, sold: true });
        const totalNotSoldItems = await Transaction.countDocuments({ ...query, sold: false });

        res.json({
            totalSale: totalSale[0]?.total || 0,
            totalSoldItems,
            totalNotSoldItems
        });
    } catch (error) {
        res.status(500).send('Error fetching statistics: ' + error.message);
    }
});

module.exports = router;
