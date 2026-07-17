import Freelancer from "../models/Freelancer.js";
import Gig from "../models/Gig.js";
import Proposal from "../models/proposal.js";
import { calculateJobMatches } from "../services/aiMatching.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const getRecommendations = asyncHandler(async (req, res) => {
  // 1. Find user's Freelancer profile
  const freelancer = await Freelancer.findOne({ user: req.user._id }).lean();
  if (!freelancer) {
    throw new ApiError(404, "Freelancer profile not found. Please create one to view matches.");
  }

  // 2. Check profile completeness
  if (!freelancer.skills || freelancer.skills.length === 0) {
    return res.status(200).json({
      success: true,
      profileIncomplete: true,
      message: "Complete your freelancer profile to get personalized job recommendations.",
      recommendations: []
    });
  }

  // 3. Fetch real open gigs (populating client for hyperlocal matching)
  const openGigs = await Gig.find({ status: "Open" }).populate("client").lean();

  // 4. Fetch already bidded gigs to exclude them
  const userProposals = await Proposal.find({ freelancer: freelancer._id }).lean();
  const appliedGigIds = userProposals.map(p => p.gig.toString());

  const eligibleGigs = openGigs.filter(gig => !appliedGigIds.includes(gig._id.toString()));

  if (eligibleGigs.length === 0) {
    return res.status(200).json({
      success: true,
      profileIncomplete: false,
      recommendations: []
    });
  }

  // 5. Run matching calculations
  const allMatches = await calculateJobMatches(freelancer, eligibleGigs);

  // Filter out completely irrelevant matches (score = 0)
  const matches = allMatches.filter(m => m.matchScore >= 1);

  // 6. Sort by matchScore descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return res.status(200).json({
    success: true,
    profileIncomplete: false,
    recommendations: matches
  });
});
