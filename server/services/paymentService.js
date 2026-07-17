export const processMockPayment = async (payment) => {
  payment.paymentStatus = "Completed";
  payment.transactionId = `MOCK-${Date.now()}`;

  await payment.save();

  return payment;
};
