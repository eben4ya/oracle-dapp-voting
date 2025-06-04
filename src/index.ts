require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");
const VotingABI = require("../out/Voting.sol/Voting.json").abi;

async function main() {
  // 1. Setup provider & contract
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    VotingABI,
    provider
  );

  console.log("Oracle listening to Voting at", process.env.CONTRACT_ADDRESS);

  // 2. Listen event CandidateRegistered
  contract.on(
    "CandidateRegistered",
    async (sessionId, candidateAddr, name, event) => {
      console.log(
        `New Candidate: session ${sessionId.toString()} - ${name} (${candidateAddr})`
      );

      try {
        // Kirim ke backend: informasikan kandidat baru
        await axios.post(
          `${process.env.BACKEND_URL}/api/oracle/candidate`,
          {
            sessionId: sessionId.toString(),
            candidate: candidateAddr,
            name: name,
            txHash: event.transactionHash,
          }
        );
        console.log("=> POST /api/oracle/candidate success");
      } catch (err) {
        console.error("Error POST ke backend:", err.message);
      }
    }
  );

  // 3. (Optional) Listen event Voted
  contract.on("Voted", (sessionId, candidateAddr, voter, event) => {
    console.log(
      `Vote: session ${sessionId.toString()} - ${candidateAddr} by ${voter}`
    );
    // Bisa juga kirim data vote ke backend jika ingin simpan histori voting
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
