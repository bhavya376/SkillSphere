let io;

export const initSocket = (socketIO) => {
  io = socketIO;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
};