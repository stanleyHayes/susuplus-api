exports.addSusuMember = async (req, res) => {
    try {
        res.status(200).json({message: `Create Susu Member`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getSusuMembers = async (req, res) => {
    try {
        res.status(200).json({message: `Get Susu Members`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getSusuMember = async (req, res) => {
    try {
        res.status(200).json({message: `Get Susu Member`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updateSusuMember = async (req, res) => {
    try {
        res.status(200).json({message: `Update Susu Member`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.removeSusuMember = async (req, res) => {
    try {
        res.status(200).json({message: `Delete Susu Member`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}
