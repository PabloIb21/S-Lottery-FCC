const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", () => {
    let raffle;
    let raffleEntranceFee;
    let deployer;

    beforeEach(async () => {
      deployer = (await getNamedAccounts()).deployer;
      raffle = await ethers.getContract("Raffle", deployer);
      raffleEntranceFee = await raffle.getEntranceFee();
    });
    describe("fulfillRandomWords", () => {
      it("works with  live Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
        console.log("Setting up test...");
        const startingTimeStamp = await raffle.getLastTimeStamp();
        const accounts = await ethers.getSigners();

        console.log("Setting up Listener...");
        await new Promise(async (resolve, reject) => {
          raffle.once("WinnerPicked", async () => {
            console.log("WinnerPicked event fired!");
            try {
              const recentWinner = await raffle.getRecentWinner();
              const raffleState = await raffle.getRaffleState();
              const winnerEndingBalance = await accounts[0].getBalance();
              const endingTimeStamp = await raffle.getLastTimeStamp();

              await expect(raffle.getPlayer(0)).to.be.reverted;
              assert.equal(recentWinner.toString(), accounts[0].address);
              assert.equal(raffleState, 0);
              assert.equal(
                winnerEndingBalance.toString(),
                winnerStartingBalance.add(raffleEntranceFee).toString()
              );
              assert(endingTimeStamp > startingTimeStamp);
              resolve();
            } catch (error) {
              console.log(error);
              reject(error);
            }
          });
          // Then entering the raffle
          console.log("Entering Raffle...");
          const tx = await raffle.enterRaffe({ value: raffleEntranceFee });
          await tx.wait(1);
          console.log("Ok, time to wait...");
          const winnerStartingBalance = await accounts[0].getBalance();
        });
      });
    });
  });