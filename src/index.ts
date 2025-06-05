import axios from "axios";
import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();
import VotingJSON from "../Voting.json";
const VotingABI = VotingJSON;

async function main() {
  // 1. Setup provider & contract
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    VotingABI,
    provider
  );

  console.log("Oracle listening to Voting at", process.env.CONTRACT_ADDRESS);

  // 2. Listen event VotingSessionCreated → fetch eligible voters & set di smart contract
  contract.on(
    "VotingSessionCreated",
    async (sessionId: bigint, start: bigint, end: bigint, event: any) => {
      const sid = sessionId.toString();
      const startTs = start.toString();
      const endTs = end.toString();
      console.log(
        `New Voting Session: session ${sid} - start ${startTs}, end ${endTs}`
      );

      try {
        // 2a. Fetch daftar semua pegawai dengan attendance di endpoint tertentu
        //    Asumsikan endpoint mengembalikan array objek { address: string, attendance: number }
        const resp = await axios.get(`${process.env.BACKEND_URL}/api/staff`);
        const staffData = resp.data;
        
        // Check if the response is an array
        if (!Array.isArray(staffData)) {
          console.error("Unexpected API response format. Expected an array of staff.");
          return;
        }

        // Filter eligible staff (those with attendance > 75%)
        const eligibleAddresses: string[] = staffData
          .filter(staff => {
            // Ensure staff has the required properties
            if (!staff || typeof staff.attendance !== 'number' || !staff.walletAddress) {
              console.warn("Invalid staff record:", staff);
              return false;
            }
            return staff.attendance > 75;
          })
          .map(staff => staff.walletAddress);

        console.log(`Eligible voters for session ${sid}:`, eligibleAddresses);

        if (eligibleAddresses.length === 0) {
          console.log("No eligible voters found for this session.");
          return;
        }

        // 2c. Panggil smart contract updateEligibility(sessionId, voters[], true)
        const tx = await contract.updateEligibility(
          BigInt(sid),
          eligibleAddresses,
          true
        );
        const receipt = await tx.wait();
        console.log(
          `=> updateEligibility(txHash=${receipt.transactionHash}) success`
        );
      } catch (err: any) {
        console.error("Error processing VotingSessionCreated:", err.message);
      }
    }
  );

  // 3. Listen event CandidateRegistered
  contract.on(
    "CandidateRegistered",
    async (
      sessionId: bigint,
      candidateAddr: string,
      name: string,
      event: any
    ) => {
      const sid = sessionId.toString();
      console.log(`New Candidate: session ${sid} - ${name} (${candidateAddr})`);

      try {
        await axios.post(`${process.env.BACKEND_URL}/api/oracle/candidate`, {
          sessionId: sid,
          candidateAddr: candidateAddr,
          candidateName: name,
        });
        console.log("=> POST /api/oracle/candidate success");
      } catch (err: any) {
        console.error("Error POST ke /api/oracle/candidate:", err.message);
      }
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
