// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Transaction } = require('./db');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// server.js (continued)
app.get('/initialize', async (req, res) => {
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
// List Transactions with Search and Pagination
app.get('/transactions', async (req, res) => {
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
// satistical api
app.get('/statistics', async (req, res) => {
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
// Bar Chart Api
app.get('/price-range', async (req, res) => {
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
        const priceRanges = [
            { range: '0-100', min: 0, max: 100 },
            { range: '101-200', min: 101, max: 200 },
            { range: '201-300', min: 201, max: 300 },
            { range: '301-400', min: 301, max: 400 },
            { range: '401-500', min: 401, max: 500 },
            { range: '501-600', min: 501, max: 600 },
            { range: '601-700', min: 601, max: 700 },
            { range: '701-800', min: 701, max: 800 },
            { range: '801-900', min: 801, max: 900 },
            { range: '901-above', min: 901, max: Number.MAX_SAFE_INTEGER }
        ];

        const rangeCounts = await Promise.all(priceRanges.map(async (range) => {
            const count = await Transaction.countDocuments({
                ...query,
                price: { $gte: range.min, $lt: range.max }
            });
            return { range: range.range, count };
        }));

        res.json(rangeCounts);
    } catch (error) {
        res.status(500).send('Error fetching price range data: ' + error.message);
    }
});
// pie chart api
app.get('/category-items', async (req, res) => {
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
        const categoryItems = await Transaction.aggregate([
            { $match: query },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.json(categoryItems);
    } catch (error) {
        res.status(500).send('Error fetching category items: ' + error.message);
    }
});
//Combined API

app.get('/combined-data', async (req, res) => {
    const { month } = req.query;

    try {
        const [transactions, statistics, priceRange, categoryItems] = await Promise.all([
            axios.get(`http://localhost:${PORT}/transactions`, { params: { month } }),
            axios.get(`http://localhost:${PORT}/statistics`, { params: { month } }),
            axios.get(`http://localhost:${PORT}/price-range`, { params: { month } }),
            axios.get(`http://localhost:${PORT}/category-items`, { params: { month } })
        ]);

        res.json({
            transactions: transactions.data,
            statistics: statistics.data,
            priceRange: priceRange.data,
            categoryItems: categoryItems.data
        });
    } catch (error) {
        res.status(500).send('Error fetching combined data: ' + error.message);
    }
});
