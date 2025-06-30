const Candidate = require("../models/Candidate");
const User = require("../models/User");
const Election = require("../models/Election");



exports.deleteElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    // Delete all candidates related to this election
    await Candidate.deleteMany({ electionId });

    // Delete the election
    await Election.findByIdAndDelete(electionId);

    res.status(200).json({ message: "Election and associated candidates deleted." });
  } catch (error) {
    console.error("Delete Election Error:", error);
    res.status(500).json({ error: "Server error while deleting election." });
  }
};
exports.getCandidates = async (req, res) => {
    try {
        const pending = await Candidate.find({ status: "pending" })
            .populate('userId', 'name username')
            .populate('electionId', 'title post')
            .sort({ createdAt: -1 });
            
        const approved = await Candidate.find({ status: "approved" })
            .populate('userId', 'name username')
            .populate('electionId', 'title post')
            .sort({ createdAt: -1 });
            
        const rejected = await Candidate.find({ status: "rejected" })
            .populate('userId', 'name username')
            .populate('electionId', 'title post')
            .sort({ createdAt: -1 });
            
        res.json({ pending, approved, rejected });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch candidates" });
    }
};

exports.approveCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id, 
            { 
                status: "approved",
                updatedAt: new Date()
            }, 
            { new: true }
        ).populate('userId', 'name username').populate('electionId', 'title post');
        
        if (!candidate) {
            return res.status(404).json({ error: "Candidate not found" });
        }
        
        res.json({ 
            message: "Candidate approved successfully", 
            candidate 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to approve candidate" });
    }
};

exports.rejectCandidate = async (req, res) => {
    try {
        const { reason } = req.body;
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id, 
            { 
                status: "rejected",
                rejectionReason: reason,
                updatedAt: new Date()
            }, 
            { new: true }
        ).populate('userId', 'name username').populate('electionId', 'title post');
        
        if (!candidate) {
            return res.status(404).json({ error: "Candidate not found" });
        }
        
        res.json({ 
            message: "Candidate rejected successfully", 
            candidate 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to reject candidate" });
    }
};

exports.getCandidateDetails = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
            .populate('userId', 'name username')
            .populate('electionId', 'title post description');
        if (!candidate) {
            return res.status(404).json({ error: "Candidate not found" });
        }
        
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch candidate details" });
    }
};

// General function to update candidate status
exports.updateCandidateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        // Validate status
        const validStatuses = ["pending", "approved", "rejected"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: "Invalid status. Must be one of: pending, approved, rejected" 
            });
        }

        // If rejecting, reason should be provided
        if (status === "rejected" && !reason) {
            return res.status(400).json({ 
                error: "Rejection reason is required when rejecting a candidate" 
            });
        }

        // Prepare update data
        const updateData = {
            status,
            updatedAt: new Date()
        };

        // Add rejection reason if status is rejected
        if (status === "rejected") {
            updateData.rejectionReason = reason;
        } else {
            // Clear rejection reason if status is not rejected
            updateData.rejectionReason = undefined;
        }

        const candidate = await Candidate.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('userId', 'name username').populate('electionId', 'title post');

        if (!candidate) {
            return res.status(404).json({ error: "Candidate not found" });
        }

        res.json({
            message: `Candidate status updated to ${status} successfully`,
            candidate
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to update candidate status" });
    }
};

// Bulk update candidate statuses
exports.bulkUpdateCandidateStatus = async (req, res) => {
    try {
        const { candidateIds, status, reason } = req.body;

        // Validate input
        if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
            return res.status(400).json({ error: "Candidate IDs array is required" });
        }

        const validStatuses = ["pending", "approved", "rejected"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: "Invalid status. Must be one of: pending, approved, rejected" 
            });
        }

        // If rejecting, reason should be provided
        if (status === "rejected" && !reason) {
            return res.status(400).json({ 
                error: "Rejection reason is required when rejecting candidates" 
            });
        }

        // Prepare update data
        const updateData = {
            status,
            updatedAt: new Date()
        };

        if (status === "rejected") {
            updateData.rejectionReason = reason;
        } else {
            updateData.rejectionReason = undefined;
        }

        // Update multiple candidates
        const result = await Candidate.updateMany(
            { _id: { $in: candidateIds } },
            updateData
        );

        // Get updated candidates
        const updatedCandidates = await Candidate.find({ _id: { $in: candidateIds } })
            .populate('userId', 'name username')
            .populate('electionId', 'title post');

        res.json({
            message: `${result.modifiedCount} candidates updated to ${status} successfully`,
            updatedCount: result.modifiedCount,
            candidates: updatedCandidates
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to bulk update candidate statuses" });
    }
};


exports.getStudents = async (req, res) => {
    try {
        const students = await User.find({ role: "user" }).select('name username department year');
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch students" });
    }
};

exports.removeStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await User.findOneAndDelete({ _id: id, role: "user" });
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }
        res.json({ message: "Student removed successfully", student });
    } catch (error) {
        res.status(500).json({ error: "Failed to remove student" });
    }
};


exports.getStats = async (req, res) => {
    try {
        const students = await User.countDocuments({ role: "user" });
        const teachers = await User.countDocuments({ role: "teacher" });
        const totalElections = await Election.countDocuments();
        const activeElections = await Election.countDocuments({ active: true });
        
        res.json({ 
            students, 
            teachers, 
            totalElections, 
            activeElections 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};
