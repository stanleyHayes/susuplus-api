const Percentage = require("../models/percentage");

exports.createPercentage = async (req, res) => {
    try {
        const {percentage} = req.body;
        if (percentage < 0 || percentage > 100)
            return res.status(400).json({message: 'Percentage should be between 0 and 100'});

        const existingPercentage = await Percentage.findOne({});

        if (!existingPercentage) {
            const newPercentage = await Percentage.create({percentage});
            return res.status(201).json({message: 'Percentage added', data: newPercentage});
        }

        res.status(200).json({message: 'Percentage retrieved', data: existingPercentage});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getPercentage = async (req, res) => {
    try {
        const percentage = await Percentage.findOne({});
        if (!percentage) {
            const newPercentage = await Percentage.create({percentage: 1});
            return res.status(200).json({message: 'Percentage retrieved', data: newPercentage});
        }
        return res.status(201).json({message: 'Percentage Retrieved', data: percentage});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.updatePercentage = async (req, res) => {
    try {
        const {percentageAmount} = req.body;
        if (percentageAmount < 0 || percentageAmount > 100)
            return res.status(400).json({message: 'Percentage should be between 0 and 100'});

        const percentage = await Percentage.findOne({});
        if (!percentage) {
            const newPercentage = await Percentage.create({percentage: 1});
            return res.status(200).json({message: 'Percentage retrieved', data: newPercentage});
        }
        percentage.percentage = percentageAmount;
        await percentage.save();
        return res.status(201).json({message: 'Percentage Retrieved', data: percentage});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
