const Vote = require("../models/Vote");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const User = require("../models/User");

// Cast a vote
exports.castVote = async (req, res) => {
    try {
        const { candidateId, electionId } = req.body;
        const voterId = req.userId;

        // Validate required fields
        if (!candidateId || !electionId) {
            return res.status(400).json({ error: "Candidate ID and Election ID are required" });
        }

        // Check if election exists and is active
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        if (!election.active) {
            return res.status(400).json({ error: "Election is not active" });
        }

        // Check if it's voting time
        const now = new Date();
        const votingDate = new Date(election.votingDate);
        
        if (now < votingDate) {
            return res.status(400).json({ error: "Voting has not started yet" });
        }

        // Check if candidate exists and is approved
        const candidate = await Candidate.findOne({ 
            _id: candidateId, 
            electionId: electionId,
            status: "approved"
        });

        if (!candidate) {
            return res.status(404).json({ error: "Candidate not found or not approved" });
        }

        // Check if user has already voted in this election
        const existingVote = await Vote.findOne({ 
            voterId: voterId, 
            electionId: electionId 
        });

        if (existingVote) {
            return res.status(400).json({ error: "You have already voted in this election" });
        }

        // Cast the vote
        const vote = new Vote({
            voterId,
            candidateId,
            electionId
        });

        await vote.save();

        res.status(201).json({ 
            message: "Vote cast successfully",
            vote: {
                id: vote._id,
                candidateId,
                electionId,
                timestamp: vote.createdAt || new Date()
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to cast vote" });
    }
};

// Get live vote count for an election
exports.getLiveVoteCount = async (req, res) => {
    try {
        const { electionId } = req.params;

        // Validate election exists
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        // Get all approved candidates for this election
        const candidates = await Candidate.find({ 
            electionId: electionId,
            status: "approved"
        }).select('name position');

        // Count votes for each candidate
        const voteCounts = await Promise.all(
            candidates.map(async (candidate) => {
                const voteCount = await Vote.countDocuments({ 
                    candidateId: candidate._id,
                    electionId: electionId
                });

                return {
                    candidateId: candidate._id,
                    candidateName: candidate.name,
                    position: candidate.position,
                    voteCount: voteCount
                };
            })
        );

        // Calculate total votes
        const totalVotes = voteCounts.reduce((sum, candidate) => sum + candidate.voteCount, 0);

        // Get total eligible voters
        const totalEligibleVoters = await User.countDocuments({ role: "user" });

        // Calculate vote percentage
        const votePercentage = totalEligibleVoters > 0 
            ? ((totalVotes / totalEligibleVoters) * 100).toFixed(2)
            : 0;

        res.json({
            electionId,
            electionTitle: election.title,
            electionPost: election.post,
            totalVotes,
            totalEligibleVoters,
            votePercentage: parseFloat(votePercentage),
            candidates: voteCounts.sort((a, b) => b.voteCount - a.voteCount), // Sort by vote count descending
            lastUpdated: new Date()
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to get live vote count" });
    }
};

// Get live vote count for active election
exports.getActiveLiveVoteCount = async (req, res) => {
    try {
        // Find active election
        const election = await Election.findOne({ active: true });
        if (!election) {
            return res.status(404).json({ error: "No active election found" });
        }

        // Use the election ID to get live vote count
        req.params.electionId = election._id;
        return exports.getLiveVoteCount(req, res);

    } catch (error) {
        res.status(500).json({ error: "Failed to get active election vote count" });
    }
};

// Get detailed vote statistics
exports.getVoteStatistics = async (req, res) => {
    try {
        const { electionId } = req.params;

        // Validate election exists
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        // Get all approved candidates with their vote counts and percentages
        const candidates = await Candidate.find({ 
            electionId: electionId,
            status: "approved"
        }).select('name position StudentId');

        const totalVotes = await Vote.countDocuments({ electionId });

        const candidateStats = await Promise.all(
            candidates.map(async (candidate) => {
                const voteCount = await Vote.countDocuments({ 
                    candidateId: candidate._id,
                    electionId: electionId
                });

                const percentage = totalVotes > 0 
                    ? ((voteCount / totalVotes) * 100).toFixed(2)
                    : 0;

                return {
                    candidateId: candidate._id,
                    candidateName: candidate.name,
                    studentId: candidate.StudentId,
                    position: candidate.position,
                    voteCount: voteCount,
                    percentage: parseFloat(percentage)
                };
            })
        );

        // Sort by vote count (descending)
        candidateStats.sort((a, b) => b.voteCount - a.voteCount);

        // Determine winner (candidate with most votes)
        const winner = candidateStats.length > 0 ? candidateStats[0] : null;

        // Get hourly vote distribution (last 24 hours)
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const hourlyVotes = await Vote.aggregate([
            {
                $match: {
                    electionId: election._id,
                    createdAt: { $gte: last24Hours }
                }
            },
            {
                $group: {
                    _id: {
                        hour: { $hour: "$createdAt" },
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.date": 1, "_id.hour": 1 }
            }
        ]);

        res.json({
            electionId,
            electionTitle: election.title,
            electionPost: election.post,
            totalVotes,
            totalEligibleVoters: await User.countDocuments({ role: "user" }),
            turnoutPercentage: parseFloat(
                ((totalVotes / await User.countDocuments({ role: "user" })) * 100).toFixed(2)
            ),
            candidates: candidateStats,
            winner: winner,
            hourlyVoteDistribution: hourlyVotes,
            generatedAt: new Date()
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to get vote statistics" });
    }
};

// Check if user has voted
exports.checkVoteStatus = async (req, res) => {
    try {
        const { electionId } = req.params;
        const voterId = req.userId;

        const vote = await Vote.findOne({ 
            voterId: voterId, 
            electionId: electionId 
        }).populate('candidateId', 'name position');

        if (vote) {
            res.json({
                hasVoted: true,
                voteId: vote._id,
                candidate: vote.candidateId,
                votedAt: vote.createdAt
            });
        } else {
            res.json({
                hasVoted: false
            });
        }

    } catch (error) {
        res.status(500).json({ error: "Failed to check vote status" });
    }
};

// Get real-time vote updates using Server-Sent Events (SSE)
exports.getVoteUpdatesSSE = async (req, res) => {
    try {
        const { electionId } = req.params;

        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Send initial vote count
        const sendVoteUpdate = async () => {
            try {
                // Get current vote counts
                const candidates = await Candidate.find({ 
                    electionId: electionId,
                    status: "approved"
                }).select('name position');

                const voteCounts = await Promise.all(
                    candidates.map(async (candidate) => {
                        const voteCount = await Vote.countDocuments({ 
                            candidateId: candidate._id,
                            electionId: electionId
                        });
                        return {
                            candidateId: candidate._id,
                            candidateName: candidate.name,
                            position: candidate.position,
                            voteCount: voteCount
                        };
                    })
                );

                const totalVotes = voteCounts.reduce((sum, candidate) => sum + candidate.voteCount, 0);

                const data = {
                    electionId,
                    totalVotes,
                    candidates: voteCounts.sort((a, b) => b.voteCount - a.voteCount),
                    timestamp: new Date()
                };

                res.write(`data: ${JSON.stringify(data)}\n\n`);
            } catch (error) {
                console.error('Error sending vote update:', error);
            }
        };

        // Send initial data
        await sendVoteUpdate();

        // Set up interval to send updates every 5 seconds
        const intervalId = setInterval(sendVoteUpdate, 5000);

        // Handle client disconnect
        req.on('close', () => {
            clearInterval(intervalId);
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to establish SSE connection" });
    }
};

// Get election results
exports.getElectionResults = async (req, res) => {
    try {
        const { electionId } = req.params;

        // Validate election exists
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        // Check if results should be available
        const now = new Date();
        const resultDate = new Date(election.resultAnnouncementDate);
        
        if (now < resultDate) {
            return res.status(400).json({ 
                error: "Results are not yet available", 
                availableAt: resultDate 
            });
        }

        // Get all approved candidates with their vote counts
        const candidates = await Candidate.find({ 
            electionId: electionId,
            status: "approved"
        }).select('name position StudentId email');

        const totalVotes = await Vote.countDocuments({ electionId });
        const totalEligibleVoters = await User.countDocuments({ role: "user" });

        const candidateResults = await Promise.all(
            candidates.map(async (candidate) => {
                const voteCount = await Vote.countDocuments({ 
                    candidateId: candidate._id,
                    electionId: electionId
                });

                const percentage = totalVotes > 0 
                    ? ((voteCount / totalVotes) * 100).toFixed(2)
                    : 0;

                return {
                    candidateId: candidate._id,
                    candidateName: candidate.name,
                    studentId: candidate.StudentId,
                    email: candidate.email,
                    position: candidate.position,
                    voteCount: voteCount,
                    percentage: parseFloat(percentage),
                    rank: 0 // Will be set after sorting
                };
            })
        );

        // Sort by vote count (descending) and assign ranks
        candidateResults.sort((a, b) => b.voteCount - a.voteCount);
        candidateResults.forEach((candidate, index) => {
            candidate.rank = index + 1;
        });

        // Determine winner(s)
        const maxVotes = candidateResults.length > 0 ? candidateResults[0].voteCount : 0;
        const winners = candidateResults.filter(candidate => candidate.voteCount === maxVotes);
        
        // Check for tie
        const isTie = winners.length > 1 && maxVotes > 0;

        // Get vote distribution by hour
        const voteDistribution = await Vote.aggregate([
            {
                $match: { electionId: election._id }
            },
            {
                $group: {
                    _id: {
                        hour: { $hour: "$createdAt" },
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.date": 1, "_id.hour": 1 }
            }
        ]);

        res.json({
            electionId,
            electionTitle: election.title,
            electionPost: election.post,
            electionType: election.type,
            electionDates: {
                nominationStart: election.nominationStartDate,
                nominationEnd: election.nominationEndDate,
                campaignStart: election.campaignStartDate,
                campaignEnd: election.campaignEndDate,
                votingDate: election.votingDate,
                resultAnnouncement: election.resultAnnouncementDate
            },
            totalVotes,
            totalEligibleVoters,
            turnoutPercentage: parseFloat(
                ((totalVotes / totalEligibleVoters) * 100).toFixed(2)
            ),
            candidates: candidateResults,
            winners: winners,
            isTie: isTie,
            voteDistribution: voteDistribution,
            resultGeneratedAt: new Date()
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to get election results" });
    }
};

// Get results for active election
exports.getActiveElectionResults = async (req, res) => {
    try {
        // Find active election
        const election = await Election.findOne({ active: true });
        if (!election) {
            return res.status(404).json({ error: "No active election found" });
        }

        // Use the election ID to get results
        req.params.electionId = election._id;
        return exports.getElectionResults(req, res);

    } catch (error) {
        res.status(500).json({ error: "Failed to get active election results" });
    }
};

// Get winner announcement
exports.getWinnerAnnouncement = async (req, res) => {
    try {
        const { electionId } = req.params;

        // Validate election exists
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        // Check if results should be available
        const now = new Date();
        const resultDate = new Date(election.resultAnnouncementDate);
        
        if (now < resultDate) {
            return res.status(400).json({ 
                error: "Results are not yet available", 
                availableAt: resultDate 
            });
        }

        // Get candidates with most votes
        const candidates = await Candidate.find({ 
            electionId: electionId,
            status: "approved"
        }).select('name position StudentId email');

        const candidateVotes = await Promise.all(
            candidates.map(async (candidate) => {
                const voteCount = await Vote.countDocuments({ 
                    candidateId: candidate._id,
                    electionId: electionId
                });
                return {
                    ...candidate.toObject(),
                    voteCount
                };
            })
        );

        // Sort by votes and get winner(s)
        candidateVotes.sort((a, b) => b.voteCount - a.voteCount);
        const maxVotes = candidateVotes.length > 0 ? candidateVotes[0].voteCount : 0;
        const winners = candidateVotes.filter(candidate => candidate.voteCount === maxVotes && maxVotes > 0);

        const totalVotes = await Vote.countDocuments({ electionId });

        res.json({
            electionId,
            electionTitle: election.title,
            electionPost: election.post,
            totalVotes,
            winners: winners.map(winner => ({
                candidateId: winner._id,
                name: winner.name,
                studentId: winner.StudentId,
                email: winner.email,
                position: winner.position,
                voteCount: winner.voteCount,
                percentage: totalVotes > 0 ? ((winner.voteCount / totalVotes) * 100).toFixed(2) : 0
            })),
            isTie: winners.length > 1,
            announcementDate: election.resultAnnouncementDate,
            generatedAt: new Date()
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to get winner announcement" });
    }
};

// Get results summary for all elections
exports.getAllElectionResults = async (req, res) => {
    try {
        const elections = await Election.find({}).sort({ createdAt: -1 });

        const electionResults = await Promise.all(
            elections.map(async (election) => {
                const totalVotes = await Vote.countDocuments({ electionId: election._id });
                const totalCandidates = await Candidate.countDocuments({ 
                    electionId: election._id, 
                    status: "approved" 
                });

                // Get winner if results are available
                let winner = null;
                const now = new Date();
                const resultDate = new Date(election.resultAnnouncementDate);

                if (now >= resultDate && totalVotes > 0) {
                    const candidates = await Candidate.find({ 
                        electionId: election._id,
                        status: "approved"
                    }).select('name position');

                    const candidateVotes = await Promise.all(
                        candidates.map(async (candidate) => {
                            const voteCount = await Vote.countDocuments({ 
                                candidateId: candidate._id,
                                electionId: election._id
                            });
                            return { ...candidate.toObject(), voteCount };
                        })
                    );

                    candidateVotes.sort((a, b) => b.voteCount - a.voteCount);
                    if (candidateVotes.length > 0) {
                        const topCandidate = candidateVotes[0];
                        winner = {
                            name: topCandidate.name,
                            position: topCandidate.position,
                            voteCount: topCandidate.voteCount
                        };
                    }
                }

                return {
                    electionId: election._id,
                    title: election.title,
                    post: election.post,
                    type: election.type,
                    active: election.active,
                    totalVotes,
                    totalCandidates,
                    winner,
                    votingDate: election.votingDate,
                    resultAnnouncementDate: election.resultAnnouncementDate,
                    resultsAvailable: now >= resultDate
                };
            })
        );

        res.json({
            elections: electionResults,
            totalElections: elections.length,
            activeElections: elections.filter(e => e.active).length,
            generatedAt: new Date()
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to get all election results" });
    }
};


exports.getApprovedCandidates = async (req, res) => {
    try {
        const { electionId } = req.params;
        if (!electionId) {
            return res.status(400).json({ error: "Election ID is required" });
        }

        const candidates = await Candidate.find({
            electionId: electionId,
            status: "approved"
        }).select('name position StudentId email statement status');

        res.json({
            electionId,
            candidates
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to get approved candidates" });
    }
};
const declareWinner = async (req, res) => {
    try {
        const { electionId } = req.params;

        // Validate election exists
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        // Check if results can be declared
        const now = new Date();
        const resultDate = new Date(election.resultAnnouncementDate);
        if (now < resultDate) {
            return res.status(400).json({ 
                error: "Cannot declare winner before result announcement date", 
                availableAt: resultDate 
            });
        }

        // Get all approved candidates and their vote counts
        const candidates = await Candidate.find({ 
            electionId: electionId,
            status: "approved"
        }).select('name position StudentId email');

        const candidateVotes = await Promise.all(
            candidates.map(async (candidate) => {
                const voteCount = await Vote.countDocuments({ 
                    candidateId: candidate._id,
                    electionId: electionId
                });
                return {
                    ...candidate.toObject(),
                    voteCount
                };
            })
        );

        // Sort by votes and get winner(s)
        candidateVotes.sort((a, b) => b.voteCount - a.voteCount);
        const maxVotes = candidateVotes.length > 0 ? candidateVotes[0].voteCount : 0;
        const winners = candidateVotes.filter(candidate => candidate.voteCount === maxVotes && maxVotes > 0);

        if (winners.length === 0) {
            return res.status(200).json({
                message: "No winner could be declared (no votes cast)",
                electionId,
                winners: []
            });
        }

        res.json({
            message: winners.length > 1 ? "It's a tie!" : "Winner declared successfully",
            electionId,
            winners: winners.map(winner => ({
                candidateId: winner._id,
                name: winner.name,
                studentId: winner.StudentId,
                email: winner.email,
                position: winner.position,
                voteCount: winner.voteCount
            })),
            isTie: winners.length > 1,
            declaredAt: new Date()
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to declare winner" });
    }
};
exports.declareWinner = declareWinner;