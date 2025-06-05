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

  // 2. Listen event CandidateRegistered
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
