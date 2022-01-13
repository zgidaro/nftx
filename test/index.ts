import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("Swap", function () {
  let boredApeContract: Contract;
  let swapContract: Contract;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;

  beforeEach(async () => {
    [owner, address1] = await ethers.getSigners();

    const BoredApeFactory = await ethers.getContractFactory("BoredApeYachtClub");
    boredApeContract = await BoredApeFactory.deploy("Bored Ape Yacht Club", "BAYC", 10000, 1);
    await boredApeContract.deployed();
    await boredApeContract.reserveApes();
    await boredApeContract.flipSaleState();

    const depositAmount = ethers.utils.parseEther("5.0");
    await boredApeContract.connect(address1).mintApe(20, { value: depositAmount });
    
    const Swap = await ethers.getContractFactory("Swap");
    swapContract = await Swap.deploy();
    await swapContract.deployed();

    await boredApeContract.setApprovalForAll(swapContract.address, true);
    await boredApeContract.connect(address1).setApprovalForAll(swapContract.address, true);
  });

  it("Should trade BAYC NFTs between 2 accounts", async function () {

    let ownerBalance = await boredApeContract.balanceOf(owner.address);
    let address1Balance = await boredApeContract.balanceOf(address1.address);
    let ownerTokenIds = [];
    let address1TokenIds = [];

    for (let i = 0; i < ownerBalance; i++) {
      ownerTokenIds.push(await boredApeContract.tokenOfOwnerByIndex(owner.address, i));
    }

    for (let i = 0; i < address1Balance; i++) {
      address1TokenIds.push(await boredApeContract.tokenOfOwnerByIndex(address1.address, i));
    }

    const toSend = 4;
    const collectionsToSend = [];

    for (let i = 0; i < toSend; i++) {
      collectionsToSend.push(boredApeContract.address);
    }
    const nftIndicesToSend = address1TokenIds.slice(0, toSend);

    const toReceive = 2;
    const collectionsToReceive = [];

    for (let i = 0; i < toReceive; i++) {
      collectionsToReceive.push(boredApeContract.address);
    }
    const nftIndicesToReceive = ownerTokenIds.slice(0, toReceive);

    const initiateTradeTx = await swapContract.connect(address1).initiateTrade(collectionsToSend, nftIndicesToSend, collectionsToReceive, nftIndicesToReceive);

    // wait until the transaction is mined
    await initiateTradeTx.wait();

    // console.log(await swapContract.idToTrade(1));
    const acceptTradeTx = await swapContract.acceptTrade(1);

    await acceptTradeTx.wait();

    expect(await boredApeContract.balanceOf(owner.address)).to.equal(ownerBalance - toReceive + toSend);
    expect(await boredApeContract.balanceOf(address1.address)).to.equal(address1Balance - toSend + toReceive);
  });
});