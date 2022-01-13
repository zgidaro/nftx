import { ethers } from "hardhat";

async function main() {
  const Swap = await ethers.getContractFactory("Swap");
  const swap = await Swap.deploy();

  await swap.deployed();

  console.log("Swap deployed to:", swap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
