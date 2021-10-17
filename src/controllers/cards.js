exports.createCard = async (req, res) => {
    try {
        res.status(200).json({message: `Create Card`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getCards = async (req, res) => {
    try {
        res.status(200).json({message: `Get Cards`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getCard = async (req, res) => {
    try {
        res.status(200).json({message: `Get Card`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updateCard = async (req, res) => {
    try {
        res.status(200).json({message: `Update Card`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.removeCard = async (req, res) => {
    try {
        res.status(200).json({message: `Remove Card`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}
