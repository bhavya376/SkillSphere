export const getUsers = (req, res) => {
  const users = [
    { id: 1, name: "Vinayak", role: "freelancer" },
    { id: 2, name: "Rahul", role: "client" },
    { id: 3, name: "Aman", role: "admin" },
  ];

  res.json({
    success: true,
    message: "Users fetched successfully",
    users,
  });
};

export const createUser = (req, res) => {
  const newUser = req.body;

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user: newUser,
  });
}; 