const Election = require("../models/Election");

// Get active election
exports.getActiveElection = async (req, res) => {
    try {
        const election = await Election.findOne({ active: true });
        if (!election) {
            return res.status(404).json({ error: "No active election found" });
        }
        res.json(election);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch active election" });
    }
};

// Get election timeline
exports.getTimeline = async (req, res) => {
    try {
        const election = await Election.find().sort({ nominationStartDate: -1 }).limit(1);
        res.json(election[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch timeline" });
    }
};

// Create new election (Admin/EC Officer only)
exports.createElection = async (req, res) => {
    try {
        const {
            title,
            description,
            post,
            nominationStartDate,
            nominationEndDate,
            campaignStartDate,
            campaignEndDate,
            votingDate,
            resultAnnouncementDate,
            type
        } = req.body;

        // Validate required fields
        if (!title || !post || !nominationStartDate || !nominationEndDate || 
            !campaignStartDate || !campaignEndDate || !votingDate || !resultAnnouncementDate) {
            return res.status(400).json({ error: "All date fields and election details are required" });
        }

        // Validate date sequence with more flexible logic
        const nominationStart = new Date(nominationStartDate);
        const nominationEnd = new Date(nominationEndDate);
        const campaignStart = new Date(campaignStartDate);
        const campaignEnd = new Date(campaignEndDate);
        const voting = new Date(votingDate);
        const resultAnnouncement = new Date(resultAnnouncementDate);
        const now = new Date();

        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (nominationStart < oneDayAgo) {
            return res.status(400).json({ error: "Nomination start date cannot be more than 1 day in the past" });
        }

        // Check basic chronological order with appropriate flexibility
        if (nominationEnd < nominationStart) {
            return res.status(400).json({ error: "Nomination end date must be after nomination start date" });
        }
        
        if (campaignStart < nominationEnd) {
            return res.status(400).json({ error: "Campaign start date must be on or after nomination end date" });
        }
        
        if (campaignEnd < campaignStart) {
            return res.status(400).json({ error: "Campaign end date must be after campaign start date" });
        }
        
        if (voting <= campaignEnd) {
            return res.status(400).json({ error: "Voting date must be after campaign end date" });
        }
        
        if (resultAnnouncement <= voting) {
            return res.status(400).json({ error: "Result announcement date must be after voting date" });
        }

        const newElection = new Election({
            title,
            description,
            post,
            nominationStartDate,
            nominationEndDate,
            campaignStartDate,
            campaignEndDate,
            votingDate,
            resultAnnouncementDate,
            type,
            active: false
        });

        await newElection.save();
        res.status(201).json({ message: "Election created successfully", election: newElection });
    } catch (error) {
        res.status(500).json({ error: "Failed to create election" });
    }
};

// Get all elections
exports.getAllElections = async (req, res) => {
    try {
        const elections = await Election.find().sort({ createdAt: -1 });
        res.json(elections);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch elections" });
    }
};

// Update election status
exports.updateElectionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;

        if (active) {
            // Deactivate all other elections first
            await Election.updateMany({}, { active: false });
        }

        const election = await Election.findByIdAndUpdate(
            id,
            { active },
            { new: true }
        );

        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        res.json({ message: "Election status updated successfully", election });
    } catch (error) {
        res.status(500).json({ error: "Failed to update election status" });
    }
};

// Get election by ID
exports.getElectionById = async (req, res) => {
    try {
        const { id } = req.params;
        const election = await Election.findById(id);
        
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        res.json(election);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch election" });
    }
};

// Delete election
exports.deleteElection = async (req, res) => {
    try {
        const { id } = req.params;
        const election = await Election.findByIdAndDelete(id);
        
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        res.json({ message: "Election deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete election" });
    }
};
