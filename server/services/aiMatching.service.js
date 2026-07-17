import axios from "axios";

export const calculateJobMatches = async (freelancer, gigs) => {
  const fSkills = (freelancer.skills || []).map(s => s.toLowerCase().trim());
  const freelancerLoc = (freelancer.location || "").toLowerCase().trim();
  const freelancerTitle = (freelancer.title || "").toLowerCase();
  const freelancerBio = (freelancer.bio || "").toLowerCase();

  // 1. Try semantic matching via Hugging Face if token is configured
  let semanticScores = [];
  let useSemantic = false;

  if (process.env.HUGGINGFACE_API_TOKEN) {
    try {
      const freelancerText = `Title: ${freelancer.title || ""}. Bio: ${freelancer.bio || ""}. Skills: ${(freelancer.skills || []).join(", ")}`;
      const gigTexts = gigs.map(gig => `Title: ${gig.title}. Description: ${gig.description}. Category: ${gig.category}. Skills: ${(gig.skills || []).join(", ")}`);

      const response = await axios.post(
        "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
        {
          inputs: {
            source_sentence: freelancerText,
            sentences: gigTexts
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          timeout: 8000
        }
      );

      if (Array.isArray(response.data)) {
        semanticScores = response.data;
        useSemantic = true;
        console.log(`[AI Matching] Hugging Face semantic scores received: ${semanticScores.length} scores`);
      } else if (response.data?.error) {
        console.error("[AI Matching] Hugging Face API error response:", response.data.error);
      }
    } catch (error) {
      const status = error.response?.status;
      const code = error.code;
      if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
        console.warn("[AI Matching] Hugging Face API unreachable (network/DNS issue). Using fallback matching.");
      } else if (status === 503) {
        console.warn("[AI Matching] Hugging Face model loading (503). Using fallback matching.");
      } else if (status === 401) {
        console.error("[AI Matching] Hugging Face API unauthorized (401). Check HUGGINGFACE_API_TOKEN.");
      } else {
        console.error("[AI Matching] Hugging Face API failed:", status || code, error.message);
      }
    }
  } else {
    console.warn("[AI Matching] HUGGINGFACE_API_TOKEN not set. Using fallback keyword matching.");
  }

  // 2. Perform score matching for each gig
  return gigs.map((gig, idx) => {
    const gSkills = (gig.skills || []).map(s => s.toLowerCase().trim());
    const gigTitleLower = (gig.title || "").toLowerCase();
    const gigDescLower = (gig.description || "").toLowerCase();
    const gigCatLower = (gig.category || "").toLowerCase();

    // ── Skill overlap (exact match) ──
    const exactMatches = fSkills.filter(s => gSkills.includes(s));
    const exactSkillScore = gSkills.length > 0 ? (exactMatches.length / gSkills.length) * 100 : 0;

    // ── Fuzzy keyword skill matching: freelancer skill appears in gig title/description ──
    const keywordMatches = fSkills.filter(s =>
      gigTitleLower.includes(s) ||
      gigDescLower.includes(s) ||
      gigCatLower.includes(s)
    );
    const keywordScore = fSkills.length > 0 ? (keywordMatches.length / fSkills.length) * 60 : 0;

    // ── Freelancer title words in gig title/description ──
    const titleWords = freelancerTitle.split(/\s+/).filter(w => w.length > 2);
    const matchedTitleWords = titleWords.filter(w =>
      gigTitleLower.includes(w) || gigDescLower.includes(w) || gigCatLower.includes(w)
    );
    const titleScore = titleWords.length > 0 ? (matchedTitleWords.length / titleWords.length) * 50 : 0;

    // ── Bio keyword overlap ──
    const bioWords = freelancerBio.split(/\s+/).filter(w => w.length > 3);
    const matchedBioWords = bioWords.filter(w =>
      gigTitleLower.includes(w) || gigDescLower.includes(w)
    );
    const bioScore = bioWords.length > 0 ? Math.min((matchedBioWords.length / bioWords.length) * 40, 20) : 0;

    // ── Category affinity ──
    const categoryScore =
      gigCatLower.includes(freelancerTitle) || freelancerTitle.includes(gigCatLower) ? 20 : 0;

    // ── Hyperlocal bonus ──
    const clientLoc = (gig.client?.location || "").toLowerCase().trim();
    const locationBonus = (freelancerLoc && clientLoc && freelancerLoc === clientLoc) ? 10 : 0;

    let matchScore = 0;
    let matchingMethod = "fallback";

    if (useSemantic && typeof semanticScores[idx] === "number") {
      const semanticScoreVal = Math.max(0, Math.min(semanticScores[idx], 1)) * 100;
      // Blend: 60% semantic + 25% skill overlap + 5% keyword + 10% title
      matchScore = Math.min(
        Math.round((semanticScoreVal * 0.60) + (exactSkillScore * 0.25) + (keywordScore * 0.05) + (titleScore * 0.10) + locationBonus),
        100
      );
      matchingMethod = "ai";
    } else {
      // Deterministic fallback — weighted multi-signal blend
      matchScore = Math.min(
        Math.round(
          (exactSkillScore * 0.40) +   // exact skill-to-skill overlap
          (keywordScore    * 0.25) +   // freelancer skill appears in gig text
          (titleScore      * 0.20) +   // freelancer title matches gig text
          (bioScore        * 0.05) +   // bio keyword overlap
          (categoryScore   * 0.10) +   // category affinity
          locationBonus
        ),
        100
      );
      matchingMethod = "fallback";
    }

    // ── Dynamic match reason assembly ──
    const displaySkills = freelancer.skills.filter(s =>
      (gig.skills || []).map(gs => gs.toLowerCase()).includes(s.toLowerCase()) ||
      gigTitleLower.includes(s.toLowerCase()) ||
      gigDescLower.includes(s.toLowerCase())
    );

    let matchReason = "";
    if (displaySkills.length > 0) {
      matchReason = `Matches your skills: ${displaySkills.slice(0, 3).join(", ")}`;
    } else if (matchedTitleWords.length > 0) {
      matchReason = `Matches your role as ${freelancer.title}`;
    } else {
      matchReason = `Gig in the ${gig.category} category`;
    }

    if (freelancerLoc && clientLoc && freelancerLoc === clientLoc) {
      matchReason += " and is in your hyperlocal region.";
    }

    return {
      gig,
      matchScore,
      matchedSkills: displaySkills,
      matchReason,
      matchingMethod
    };
  });
};
