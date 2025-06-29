const Candidate = require("../models/Candidate");
const User = require("../models/User");
const Election = require("../models/Election");

exports.applyCandidate = async (req, res) => {
    try {
        const { name, StudentId, email, phone, statement, position, electionId } = req.body;
        
        // Validate required fields
        if (!name || !StudentId || !email || !phone || !statement || !position || !electionId) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Validate statement length
        if (statement.length < 50 || statement.length > 500) {
            return res.status(400).json({ error: "Statement must be between 50 and 500 characters" });
        }

        // Check if election exists and is active
        // const election = await Election.findById(electionId);
        // if (!election) {
        //     return res.status(404).json({ error: "Election not found" });
        // }

        // if (!election.active) {
        //     return res.status(400).json({ error: "Election is not active" });
        // }

        // Check if user has already applied for this election
        const existingApplication = await Candidate.findOne({
            userId: req.userId,
            electionId: electionId
        });

        if (existingApplication) {
            return res.status(400).json({ error: "You have already applied for this election" });
        }

        // Check if StudentId or email already exists
        const existingCandidate = await Candidate.findOne({
            $or: [
                { StudentId: StudentId },
                { email: email }
            ]
        });

        if (existingCandidate) {
            return res.status(400).json({ error: "Student ID or email already registered as candidate" });
        }

        const candidate = new Candidate({
            name,
            StudentId,
            email,
            phone,
            statement,
            userId: req.userId,
            position,
            status: "pending",
            electionId
        });

        await candidate.save();
        res.status(201).json({ 
            message: "Candidate application submitted successfully",
            candidate: {
                id: candidate._id,
                name: candidate.name,
                position: candidate.position,
                status: candidate.status
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Student ID or email already exists" });
        }
        res.status(500).json({ error: "Failed to submit candidate application" });
    }
};

// Get user's candidate applications
exports.getMyCandidateApplications = async (req, res) => {
    try {
        const applications = await Candidate.find({ userId: req.userId })
            .populate('electionId', 'title post active')
            .sort({ createdAt: -1 });
        
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch candidate applications" });
    }
};

// Get candidate application by ID
exports.getCandidateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await Candidate.findOne({ 
            _id: id, 
            userId: req.userId 
        }).populate('electionId', 'title post active');
        
        if (!application) {
            return res.status(404).json({ error: "Candidate application not found" });
        }
        
        res.json(application);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch candidate application" });
    }
};

// Update candidate application (only if status is pending)
exports.updateCandidateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, StudentId, email, phone, statement, position } = req.body;
        
        const application = await Candidate.findOne({ 
            _id: id, 
            userId: req.userId,
            status: "pending"
        });
        
        if (!application) {
            return res.status(404).json({ error: "Candidate application not found or cannot be modified" });
        }

        // Validate statement if provided
        if (statement && (statement.length < 50 || statement.length > 500)) {
            return res.status(400).json({ error: "Statement must be between 50 and 500 characters" });
        }

        // Update only provided fields
        const updateData = {};
        if (name) updateData.name = name;
        if (StudentId) updateData.StudentId = StudentId;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (statement) updateData.statement = statement;
        if (position) updateData.position = position;

        const updatedApplication = await Candidate.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('electionId', 'title post active');
        
        res.json({
            message: "Candidate application updated successfully",
            candidate: updatedApplication
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Student ID or email already exists" });
        }
        res.status(500).json({ error: "Failed to update candidate application" });
    }
};

// Delete candidate application (only if status is pending)
exports.deleteCandidateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        
        const application = await Candidate.findOne({ 
            _id: id, 
            userId: req.userId,
            status: "pending"
        });
        
        if (!application) {
            return res.status(404).json({ error: "Candidate application not found or cannot be deleted" });
        }

        await Candidate.findByIdAndDelete(id);
        
        res.json({ message: "Candidate application deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete candidate application" });
    }
};
