// db.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    dateOfSale: Date,
    category: String,
    sold: Boolean
});

const Transaction = mongoose.model('Transaction', transactionSchema);

mongoose.connect('mongodb://localhost:27017/transactions', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports = {
    Transaction
};
