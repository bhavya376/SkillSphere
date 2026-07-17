export const getTest = (req, res) => {
  res.json({
    success: true,
    message: "Test API is working from controller",
  });
};