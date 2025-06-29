const mongoose = require('mongoose');

const SystemStatsSchema = new mongoose.Schema({
    cpuUsage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    memoryUsage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    diskUsage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    uptime: {
        type: Number,
        required: true,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SystemStats', SystemStatsSchema);