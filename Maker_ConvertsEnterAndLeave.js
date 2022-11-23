const Web3 = require("web3");

const TokenA = require("./src/abis/ERC20Creator.json");
const TokenB = require("./src/abis/ERC20Creator1.json");

const Pair = require("./src/abis/UniswapV2Pair.json");
const Factory = require("./src/abis/UniswapV2Factory.json");
const Router = require("./src/abis/UniswapV2Router02.json");
const WETH = require("./src/abis/WETH.json");

const XdYe = require("./src/abis/XdYeToken.json");
const XdYeBar = require("./src/abis/XdYeBar.json");
const XdYeMaker = require("./src/abis/XdYeMaker.json");

const UniswapV2ERC20 = require("./src/abis/UniswapV2ERC20.json");

const checkXdYeMaker = async () => {
  const web3 = new Web3("http://localhost:8545");

  const id = await web3.eth.net.getId();

  const addresses = await web3.eth.getAccounts();

  const gas = new web3.utils.BN("6000000");

  const bn = new web3.utils.BN("100000000000000000000000"); //? 10,000
  const bn2 = new web3.utils.BN("10000000000000000000"); //? 100

  const factory = new web3.eth.Contract(
    Factory.abi,
    Factory.networks[id].address
  );

  const router = new web3.eth.Contract(Router.abi, Router.networks[id].address);

  const tokenA = new web3.eth.Contract(tokenABI, TokenA.networks[id].address);
  const tokenB = new web3.eth.Contract(tokenABI, TokenB.networks[id].address);

  const xdye = new web3.eth.Contract(XdYe.abi, XdYe.networks[id].address);
  const xdyeBar = new web3.eth.Contract(
    XdYeBar.abi,
    XdYeBar.networks[id].address
  );
  const xdyeMaker = new web3.eth.Contract(
    XdYeMaker.abi,
    XdYeMaker.networks[id].address
  );

  const weth = new web3.eth.Contract(WETH.abi, WETH.networks[id].address);

  let llp_tokenA_tokenB;

  try {
    const xdyeBal = await xdye.methods.balanceOf(addresses[2]).call();

    const owner = await xdye.methods.owner().call();

    await xdye.methods.mint(addresses[2], web3.utils.toWei("100000000")).send({
      from: owner,
      gas: gas,
    });

    const xdyeBal_ = await xdye.methods.balanceOf(addresses[2]).call();

    console.log(`
    
    Could mint XDYE to ADD[2]

    Pre_minting ADD[2]: ${web3.utils.fromWei(xdyeBal)} XDYE
    Post_minting ADD[2]: ${web3.utils.fromWei(xdyeBal_)} XDYE

    `);
  } catch (e) {
    console.log("ERROR: Miniting XDYEs");
    console.log(e);
  }

  try {
    const xdyeBal = await xdye.methods.balanceOf(addresses[3]).call();

    const owner = await xdye.methods.owner().call();

    await xdye.methods.mint(addresses[3], web3.utils.toWei("100000000")).send({
      from: owner,
      gas: gas,
    });

    const xdyeBal_ = await xdye.methods.balanceOf(addresses[3]).call();

    console.log(`
    
    Could mint XDYE to ADD[3]

    Pre_minting ADD[3]: ${web3.utils.fromWei(xdyeBal)} XDYE
    Post_minting ADD[3]: ${web3.utils.fromWei(xdyeBal_)} XDYE

    `);
  } catch (e) {
    console.log("ERROR: Miniting XDYEs");
    console.log(e);
  }

  setTimeout(async () => {
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
          XdYeBar.networks[id].address,
          web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
        )
        .send({
          from: addresses[3],
          gas: gas,
        });

      console.log("XDYE has been approved for Router & XdYe Bar");
    } catch (e) {
      console.log("ERROR: XDYE could NOT be approved for Router & XdYe Bar");
      console.log(e);
    }
  });

  setTimeout(async () => {
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

      console.log(`
      
      Could create & add liquidity for pair (WETH - XDYE)
      
      `);
    } catch (e) {
      console.log(
        "ERROR: Could NOT create & add liquidity for pair (WETH - XDYE)"
      );
      console.log(e);
    }
  }, 10 * 1000);

  setTimeout(async () => {
    try {
      const amountOut_ETH_XDYE = await router.methods
        .getAmountsOut(web3.utils.toWei("25"), [
          WETH.networks[id].address,
          XdYe.networks[id].address,
        ])
        .call({ from: addresses[6] });
      console.log(
        "I am swaping: ",
        web3.utils.fromWei(amountOut_ETH_XDYE[0]),
        " ETH "
      );
      console.log(
        "I will get: ",
        web3.utils.fromWei(amountOut_ETH_XDYE[1]),
        " XDYE"
      );

      const amountOut_ETH_XDYE_min =
        web3.utils.fromWei(amountOut_ETH_XDYE[1]) * 0.8;

      console.log("Or a MINIMUM : ", amountOut_ETH_XDYE_min, " XDYE");

      const balanceXDYE_before = await xdye.methods
        .balanceOf(addresses[6])
        .call({ from: addresses[6] });
      console.log(`
        Purchaser ADD[6] XDYE Balance (before): ${web3.utils.fromWei(
          balanceXDYE_before
        )} XDYE
            `);

      const swap_amount = amountOut_ETH_XDYE_min.toString();

      const preETHBal = await web3.eth.getBalance(addresses[6]);
      console.log(`ETH BALANCE (before): ${web3.utils.fromWei(preETHBal)} ETH`);
      console.log("Preparing swap ETH --> XDYE");
      await router.methods
        .swapETHForExactTokens(
          web3.utils.toWei(swap_amount),
          [WETH.networks[id].address, XdYe.networks[id].address],
          addresses[6],
          Math.floor(Date.now() / 1000) + 60 * 10
        )
        .send({
          from: addresses[6],
          gas: gas,
          value: web3.utils.toWei("25"),
        });
      console.log("Done SWAP (ETH-XDYE)");
      const balanceXDYE_after = await xdye.methods
        .balanceOf(addresses[6])
        .call({ from: addresses[6] });

      const postETHBal = await web3.eth.getBalance(addresses[6]);
      console.log(`ETH BALANCE (post): ${web3.utils.fromWei(postETHBal)} ETH`);
      console.log(`
            INFO: For 25 ETH
            Expecting AmountOutDesired: ${amountOut_ETH_XDYE_min}
    Purchaser ADD[6] XDYE Balance (after): ${web3.utils.fromWei(
      balanceXDYE_after
    )} XDYE
    `);
    } catch (e) {
      console.log("ERROR: When trying SWAP ETH --> XDYE");
      console.log(e);
    }
  }, 24 * 1000);

  setTimeout(async () => {
    const xdyeInWallet = await xdye.methods.balanceOf(addresses[3]).call();

    await xdye.methods
      .approve(XdYeBar.networks[id].address, xdyeInWallet)
      .send({ from: addresses[3], gas: gas });

    await xdyeBar.methods
      .enter(xdyeInWallet)
      .send({ from: addresses[3], gas: gas });

    const postXdyeInWallet = await xdye.methods.balanceOf(addresses[3]).call();

    console.log(`
    
    -- Interacting with XdYe BAR --
    
    ADD[3] (Balance PreDeposit on BAR): ${web3.utils.fromWei(xdyeInWallet)} XDYE

    ADD[3] (Balance PostDeposit on BAR): ${web3.utils.fromWei(
      postXdyeInWallet
    )} XDYE

    `);
  }, 26 * 1000);

  setTimeout(async () => {
    //! Remove Liquidity (because TradingFees are minted when user ADDs/Withdraws Liquidity)

    try {
      const llp_WETH_XDYE = await factory.methods
        .getPair(WETH.networks[id].address, XdYe.networks[id].address)
        .call();

      console.log(`Removing Liquidity of: ${llp_WETH_XDYE}`);

      const token_llp = new web3.eth.Contract(
        UniswapV2ERC20.abi,
        llp_WETH_XDYE
      );

      const user_balance_token_llp = await token_llp.methods
        .balanceOf(addresses[2])
        .call();

      const pair_eth_xdye = new web3.eth.Contract(Pair.abi, llp_WETH_XDYE);

      const _balance = await token_llp.methods.balanceOf(addresses[2]).call();

      let withAmount = web3.utils.fromWei(_balance) * 0.5;

      const bnRemove = "100";

      await pair_eth_xdye.methods
        .approve(
          Router.networks[id].address,
          web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
        )
        .send({
          from: addresses[2],
          gas: gas,
        });

      console.log('Approved ETH-XDYE LP "manipulation"');

      //? EXTRA
      const liquidity = await pair_eth_xdye.methods
        .balanceOf(llp_WETH_XDYE)
        .call();

      console.log(liquidity);
      console.log(web3.utils.fromWei(liquidity));
      //?
      amount = web3.utils.toWei(withAmount.toString(), "ether");

      await router.methods
        .removeLiquidityETH(
          XdYe.networks[id].address,
          amount,
          0,
          0,
          addresses[2],
          Math.floor(Date.now() / 1000) + 60 * 10
        )
        .send({ from: addresses[2], gas: gas });

      console.log("Could Remove (50%) Liquidity ETH-XDYE");

      const endBal = await token_llp.methods.balanceOf(addresses[2]).call();
      console.log(`User has: ${web3.utils.fromWei(endBal)} ETH-XDYE LP`);
    } catch (e) {
      console.log("ERROR: Removing Liquidity");
      console.log(e);
    }
  }, 37 * 1000);

  setTimeout(async () => {
    try {
      await xdyeMaker.methods
        .convert(WETH.networks[id].address, XdYe.networks[id].address)
        .send({
          from: addresses[4],
          gas: gas,
        });
      console.log("Could Execute: XdYe Maker convert() from a ANY ADD ");
    } catch (e) {
      console.log("FAILED ON XDYE MAKER CONVERT from ADD[4]");
      console.log(e);
    }
  }, 44 * 1000);

  //! Check if SYST. ARQUITECTURE worked

  setTimeout(async () => {
    try {
      const add3_xdye_in_bar = await xdyeBar.methods
        .balanceOf(addresses[3])
        .call();

      console.log(web3.utils.fromWei(add3_xdye_in_bar));
      console.log(web3.utils.fromWei(add3_xdye_in_bar));
      console.log(web3.utils.fromWei(add3_xdye_in_bar));

      await xdyeBar.methods
        .leave(add3_xdye_in_bar)
        .send({ from: addresses[3], gas: gas });

      console.log("✅ Could leave XdYe Bar");

      const xdyePostBar = await xdye.methods.balanceOf(addresses[3]).call();

      console.log(`
      
      _ Post XdYe Bar Summary _

      ADD[3]:  ${web3.utils.fromWei(xdyePostBar)} XDYE        
      
      `);
    } catch (e) {
      console.log("ERROR: While checking FINAL DATA");
      console.log(e);
    }
  }, 50 * 1000);

  setTimeout(async () => {
    try {
      const addressPair_1 = await factory.methods
        .getPair(WETH.networks[id].address, XdYe.networks[id].address)
        .call();

      const eth_xdye_lp_contract = new web3.eth.Contract(
        tokenABI,
        addressPair_1
      );


      const xdyeMaker_xdye = await xdye.methods
        .balanceOf(XdYeMaker.networks[id].address)
        .call();
      const xdyeMaker_weth = await wewt.methods
        .balanceOf(XdYeMaker.networks[id].address)
        .call();
      const xdyeMaker_eth_xdye_lp = await eth_xdye_lp_contract.methods
        .balanceOf(XdYeMaker.networks[id].address)
        .call();

      console.log(`
      
      _ XdYe Maker Summary _

      XdYeMaker ADD: ${web3.utils.fromWei(
        xdyeMaker_eth_xdye_lp
      )} LP (ETH-XDYE)
      XdYeMaker ADD: ${web3.utils.fromWei(xdyeMaker_xdye)} XDYE        
      XdYeMaker ADD: ${web3.utils.fromWei(xdyeMaker_weth)} WETH 
      
      `);

      const xdyeBar_xdye = await xdye.methods
        .balanceOf(XdYeBar.networks[id].address)
        .call();
      const xdyeBar_weth = await wewt.methods
        .balanceOf(XdYeBar.networks[id].address)
        .call();

      console.log(`
      
      _ XdYe Bar Summary _

      XdYeBar ADD: ${web3.utils.fromWei(xdyeBar_xdye)} XDYE        
      XdYeBar ADD: ${web3.utils.fromWei(xdyeBar_weth)} WETH 
      
      `);
    } catch (e) {
      console.log("ERROR: While checking FINAL DATA");
      console.log(e);
    }
  }, 55 * 1000);
};

checkXdYeMaker();
