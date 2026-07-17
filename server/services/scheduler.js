import Contract from "../models/contract.js";
import Payment from "../models/Payment.js";
import { createNotification } from "./notification.service.js";

/**
 * Start the Contract / Milestone Auto-Completion and Reminder Scheduler.
 * Runs at regular intervals to audit active contracts that have passed their deadline.
 */
export const startContractScheduler = () => {
  console.log("[SCHEDULER] Contract & milestone scheduler initialized.");

  // Run audit job every 5 minutes (300000 ms)
  const intervalTime = 5 * 60 * 1000;

  const runAudit = async () => {
    console.log("[SCHEDULER] Auditing active contracts...");
    try {
      const activeContracts = await Contract.find({ status: "Active" });
      const now = new Date();

      for (const contract of activeContracts) {
        if (contract.endDate && now > new Date(contract.endDate)) {
          // Verify if payment has been released for this contract
          const payment = await Payment.findOne({
            contract: contract._id,
            paymentStatus: "Completed",
          });

          if (payment) {
            // Deliverables paid & deadline passed => Auto-complete contract
            contract.status = "Completed";
            await contract.save();

            console.log(`[SCHEDULER] Auto-completed paid contract: ${contract._id}`);

            // Notify both parties
            if (contract.client) {
              const Client = (await import("../models/client.js")).default;
              const clientInfo = await Client.findById(contract.client);
              if (clientInfo) {
                await createNotification({
                  recipient: clientInfo.user,
                  type: "system",
                  title: "Contract Auto-Completed",
                  message: "Your contract has been automatically completed since the end date passed and payments were released.",
                });
              }
            }

            if (contract.freelancer) {
              const Freelancer = (await import("../models/Freelancer.js")).default;
              const freelancerInfo = await Freelancer.findById(contract.freelancer);
              if (freelancerInfo) {
                await createNotification({
                  recipient: freelancerInfo.user,
                  type: "system",
                  title: "Contract Auto-Completed",
                  message: "Your contract has been automatically completed since the end date passed and payments were released.",
                });
              }
            }
          } else {
            // Deadline passed but no completed payment => Send warning reminder
            console.log(`[SCHEDULER] Warning: Active contract ${contract._id} is past deadline but unpaid.`);

            if (contract.client) {
              const Client = (await import("../models/client.js")).default;
              const clientInfo = await Client.findById(contract.client);
              if (clientInfo) {
                await createNotification({
                  recipient: clientInfo.user,
                  type: "system",
                  title: "Contract Past Deadline",
                  message: "Warning: Your contract deadline has passed but milestone payment is pending. Please complete or file a dispute.",
                });
              }
            }

            if (contract.freelancer) {
              const Freelancer = (await import("../models/Freelancer.js")).default;
              const freelancerInfo = await Freelancer.findById(contract.freelancer);
              if (freelancerInfo) {
                await createNotification({
                  recipient: freelancerInfo.user,
                  type: "system",
                  title: "Contract Past Deadline",
                  message: "Warning: Your contract deadline has passed but milestone payment is pending. Contact your client to release milestones.",
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[SCHEDULER] Contract audit failed:", err.message);
    }
  };

  // Run immediately on server start, then on interval
  setTimeout(runAudit, 5000);
  setInterval(runAudit, intervalTime);
};
