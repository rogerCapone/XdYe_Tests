const Web3 = require("web3");
const WETH = require("./src/abis/WETH.json");
const XdYe = require("./src/abis/XdYeToken.json");
const MasterChef = require("./src/abis/MasterChef.json");
const Pair = require("./src/abis/UniswapV2Pair.json");
const Factory = require("./src/abis/UniswapV2Factory.json");
const Router = require("./src/abis/UniswapV2Router02.json");



const masterChefTesting = async () => {
  const web3 = new Web3("http://localhost:8545");

  const id = await web3.eth.net.getId();
  console.log(id);

  const addresses = await web3.eth.getAccounts();

  const gas = new web3.utils.BN("6000000");

  const superBn = new web3.utils.BN(
    "10000000000000000000000000000000000000000"
  ); //? 10,000
  const bn = new web3.utils.BN("100000000000000000000000"); //? 10,000
  const bn2 = new web3.utils.BN("100000000000000000000"); //? 100

  //TODO: Smart Contracts Main Declaration

  const factory = new web3.eth.Contract(
    Factory.abi,
    Factory.networks[id].address
  );

  const router = new web3.eth.Contract(Router.abi, Router.networks[id].address);


  const xdye = new web3.eth.Contract(XdYe.abi, XdYe.networks[id].address);

  const masterChef = new web3.eth.Contract(
    MasterChef.abi,
    MasterChef.networks[id].address
  );

  const wewt = new web3.eth.Contract(WETH.abi, WETH.networks[id].address);

  let llp_tokenA_tokenB;

  try {
    const xdyeBal = await xdye.methods.balanceOf(addresses[2]).call();

    const owner = await xdye.methods.owner().call();

    await xdye.methods.mint(addresses[2], superBn).send({
      from: owner,
      gas: gas,
    });

    await xdye.methods.mint(addresses[2], bn).send({
      from: owner,
      gas: gas,
    });

    await xdye.methods
      .transferOwnership(MasterChef.networks[id].address)
      .send({
        from: owner,
        gas: gas,
      });

    const xdyeBal_ = await xdye.methods.balanceOf(addresses[2]).call();

    console.log(`
    
    Could mint XdYe to ADD[2]

    Pre_minting ADD[2]: ${web3.utils.fromWei(xdyeBal)} XDYE
    Post_minting ADD[2]: ${web3.utils.fromWei(xdyeBal_)} XDYE

    `);
  } catch (e) {
    console.log("ERROR: Miniting XDYEs");
    console.log(e);
  }

  try {
  
    await xdye.methods
      .approve(
        Router.networks[id].address,
        web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
      )
      .send({
        from: addresses[2],
        gas: gas,
      });
    await xdye.methods
      .approve(
        MasterChef.networks[id].address,
        web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
      )
      .send({
        from: addresses[3],
        gas: gas,
      });

    console.log("XdYe has been approved");
  } catch (e) {
    console.log("ERROR: While fetching Total Supply Data");
    console.log(e);
  }

  try {
    await router.methods
      .addLiquidityETH(
        XdYe.networks[id].address,
        web3.utils.toWei("100"),
        0,
        0,
        addresses[2],
        Math.floor(Date.now() / 1000) + 60 * 10
      )
      .send({
        from: addresses[2],
        gas: gas,
        value: web3.utils.toWei("10"),
      });

    console.log("ADD[2]: Could ADD Liquidity ");
  } catch (e) {
    console.log("ERROR: Adding liquidity to pair ETH-XDYE");
    console.log(e);
  }

  setTimeout(async () => {
    try {
      const pairAddress = await factory.methods
        .getPair(WETH.networks[id].address, XdYE.networks[id].address)
        .call();

      await masterChef.methods.add(2, pairAddress, true).send({
        from: addresses[0],
        gas: gas,
      });

      console.log(`
    Created new FARM for ETH-XDYE (${pairAddress})  
    `);
      console.log(`
    MasterChef is now rewarding for ETH-XDYE LPs  
    `);
    } catch (e) {
      console.log("ERROR: Creating MasterChef for pair ETH-XDYE");
      console.log(e);
    }
  }, 10 * 1000);

  setTimeout(async () => {
    try {
      const pairAddress = await factory.methods
        .getPair(WETH.networks[id].address, XdYE.networks[id].address)
        .call();

      const pair = new web3.eth.Contract(Pair.abi, pairAddress);

      const lp_amount = await pair.methods.balanceOf(addresses[2]).call();

      console.log(`AD[2] has: ${web3.utils.fromWei(lp_amount)} LP to deposit`);

      await pair.methods.approve(MasterChef.networks[id].address, bn).send({
        from: addresses[2],
        gas: gas,
      });

      await masterChef.methods.deposit(0, lp_amount).send({
        from: addresses[2],
        gas: gas,
      });

      console.log("ADD[2] Could Deposit on Master Chef PoolId: 0 (ETH-XDYE)");
    } catch (e) {
      console.log("ERROR: Depositing to MasterChef for pair ETH-XDYE");
      console.log(e);
    }
  }, 15 * 1000);

  setTimeout(async () => {
    let pdtReward = await masterChef.methods
      .pendingXdYe(0, addresses[2])
      .call();
    try {
      //? This is performed in order for Truffle to include another Tx (so we can check that rewards have been created)
      await web3.eth.sendTransaction({
        from: addresses[5],
        to: addresses[6],
        value: web3.utils.toWei("1"),
        gas: gas,
      });
      pdtReward = await masterChef.methods.pendingXdYe(0, addresses[2]).call();
      console.log(` ADD[2] Pdt Reward: ${web3.utils.fromWei(pdtReward)} XDYE`);

      await web3.eth.sendTransaction({
        from: addresses[5],
        to: addresses[6],
        value: web3.utils.toWei("1"),
        gas: gas,
      });
      pdtReward = await masterChef.methods.pendingXdYe(0, addresses[2]).call();
      console.log(` ADD[2] Pdt Reward: ${web3.utils.fromWei(pdtReward)} XDYE`);

      await web3.eth.sendTransaction({
        from: addresses[6],
        to: addresses[5],
        value: web3.utils.toWei("1"),
        gas: gas,
      });
      pdtReward = await masterChef.methods.pendingXdYe(0, addresses[2]).call();
      console.log(` ADD[2] Pdt Reward: ${web3.utils.fromWei(pdtReward)} XDYE`);

      await web3.eth.sendTransaction({
        from: addresses[6],
        to: addresses[5],
        value: web3.utils.toWei("1"),
        gas: gas,
      });
      pdtReward = await masterChef.methods.pendingXdYe(0, addresses[2]).call();
      console.log(` ADD[2] Pdt Reward: ${web3.utils.fromWei(pdtReward)} XDYE`);
    } catch (e) {
      console.log("ERROR: Making Tx or Fetching Pdt. Rewards");
      console.log(e);
    }
  }, 17 * 1000);

  setTimeout(async () => {
    let pdtReward = await masterChef.methods
      .pendingXdYe(0, addresses[2])
      .call();
    console.log(`Pdt Reward: ${web3.utils.fromWei(pdtReward)}`);

    try {
      await web3.eth.sendTransaction({
        from: addresses[5],
        to: addresses[6],
        value: web3.utils.toWei("1"),
        gas: gas,
      });
      pdtReward = await masterChef.methods.pendingXdYe(0, addresses[2]).call();
      console.log(` ADD[2] Pdt Reward: ${web3.utils.fromWei(pdtReward)} XDYE`);

      await web3.eth.sendTransaction({
        from: addresses[5],
        to: addresses[6],
        value: web3.utils.toWei("1"),
        gas: gas,
      });
      pdtReward = await masterChef.methods.pendingXdYe(0, addresses[2]).call();
      console.log(` ADD[2] Pdt Reward: ${web3.utils.fromWei(pdtReward)} XDYE`);

      await web3.eth.sendTransaction({
        from: addresses[6],
        to: addresses[5],
        value: web3.utils.toWei("1"),
        gas: gas,
      });
      pdtReward = await masterChef.methods.pendingXdYe(0, addresses[2]).call();
      console.log(` ADD[2] Pdt Reward: ${web3.utils.fromWei(pdtReward)} XDYE`);

      await web3.eth.sendTransaction({
        from: addresses[6],
        to: addresses[5],
        value: web3.utils.toWei("1"),
        gas: gas,
      });
      pdtReward = await masterChef.methods.pendingXdYe(0, addresses[2]).call();
      console.log(` ADD[2] Pdt Reward: ${web3.utils.fromWei(pdtReward)} XDYE`);
    } catch (e) {
      console.log("ERROR: Making Tx or Fetching Pdt. Rewards");
      console.log(e);
    }
  }, 19 * 1000);

  setTimeout(async () => {
    try {
      const pairAddress = await factory.methods
        .getPair(WETH.networks[id].address, XdYe.networks[id].address)
        .call();
      const pair = new web3.eth.Contract(tokenABI, pairAddress);

      const beforeWith = await pair.methods.balanceOf(addresses[2]).call();
      const xdye_beforeWith = await xdye.methods
        .balanceOf(addresses[2])
        .call();

      console.log(`BEFORE WITHDRAWING from MC:
      
        USER ADD[2]: ${web3.utils.fromWei(beforeWith)} LP
        USER ADD[2]: ${web3.utils.fromWei(xdye_beforeWith)} XDYE
      
      `);

      await masterChef.methods.withdraw(0, userInfo.amount).send({
        from: addresses[2],
        gas: gas,
      });
      console.log("Could withdraw LP from Master Chef");

      const afterWith = await pair.methods.balanceOf(addresses[2]).call();
      const xdye_afterWith = await xdye.methods
        .balanceOf(addresses[2])
        .call();

      console.log(`AFTER WITHDRAWING from MC:
      
        USER ADD[2]: ${web3.utils.fromWei(afterWith)} LP
        USER ADD[2]: ${web3.utils.fromWei(xdye_afterWith)} XDYE
      
      `);
    } catch (e) {
      console.log("ERROR: Withdrawing LP from Master Chef");
      console.log(e);
    }
  }, 22 * 1000);
};

masterChefTesting();
