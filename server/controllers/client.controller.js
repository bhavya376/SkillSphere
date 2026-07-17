import Client from "../models/client.js";

export const createClientProfile = async (req, res) => {
  const { companyName, industry, website, description, location } = req.body;

  const existingClient = await Client.findOne({
    user: req.user._id,
  });

  if (existingClient) {
    existingClient.companyName = companyName || existingClient.companyName;
    existingClient.industry = industry || existingClient.industry;
    existingClient.website = website || existingClient.website;
    existingClient.description = description || existingClient.description;
    existingClient.location = location || existingClient.location;
    await existingClient.save();
    return res.status(200).json({
      message: "Client profile updated successfully",
      client: existingClient,
    });
  }

  const client = await Client.create({
    user: req.user._id,
    companyName,
    industry,
    website,
    description,
    location,
  });

  return res.status(201).json({
    message: "Client profile created successfully",
    client,
  });
};

export const getClientProfile = async (req, res) => {
  try {
    const client = await Client.findOne({ user: req.user._id }).populate("user", "name email avatar");
    if (!client) {
      return res.status(404).json({ message: "Client profile not found" });
    }
    return res.status(200).json({ success: true, client });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};