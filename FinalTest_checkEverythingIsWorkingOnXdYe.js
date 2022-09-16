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


const checkEverythingIsWorkingOnXdYe = async () => {
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

  //! This has been done on the deployment procedure
  // try {
  //   await factory.methods.setFeeTo(xdyeMaker.networks[id].address).send({
  //     from: addresses[0],
  //     gas: gas,
  //   });

  //   console.log("Could change FEE To XdYe Maker");
  // } catch (e) {
  //   console.log("⛔️ ERROR: While CHANGING FACTORY FEE --> XdYe Maker");
  //   console.log(e);
  // }

  try {
    //! Send TOKEN A and TOKEN B to ADD[2] to provide Liquidity
    
    await tokenA.methods.transfer(addresses[2], bn).send({
      from: addresses[0],
      gas: gas,
    });
    await tokenB.methods.transfer(addresses[2], bn).send({
      from: addresses[0],
      gas: gas,
    });
    
    const balIn2 = await xdye.methods.balanceOf(addresses[2]).call();

    await xdye.methods.transfer(addresses[3], bn2).send({
      from: addresses[2],
      gas: gas,
    });

    const preAddLiquidityTokenA = await tokenA.methods
      .balanceOf(addresses[2])
      .call();
    const preAddLiquidityTokenB = await tokenB.methods
      .balanceOf(addresses[2])
      .call();

    console.log(`
ADD[2]: ${web3.utils.fromWei(preAddLiquidityTokenA)} TKA
ADD[2]: ${web3.utils.fromWei(preAddLiquidityTokenB)} TKB

`);
  } catch (e) {
    console.log("ERROR: While sending Token A and Token B");
    console.log(e);
  }

  setTimeout(async () => {
    try {
      const tsTokenA = await tokenA.methods.totalSupply().call();
      const tsTokenB = await tokenA.methods.totalSupply().call();
      const tsWeth = await weth.methods.totalSupply().call();
      const tsXdYe = await xdye.methods.totalSupply().call();

      console.log(`TS A: ${web3.utils.fromWei(tsTokenA)}`);
      console.log(`TS B: ${web3.utils.fromWei(tsTokenB)}`);
      console.log(`TS WETH: ${web3.utils.fromWei(tsWeth)}`);
      console.log(`TS XDYE: ${web3.utils.fromWei(tsXdYe)}`);

      await tokenA.methods
        .approve(
          Router.networks[id].address,
          web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
        )
        .send({
          from: addresses[2],
          gas: gas,
        });
      await tokenB.methods
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
          Router.networks[id].address,
          web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
        )
        .send({
          from: addresses[2],
          gas: gas,
        });

      console.log("XDYE, TOKEN A , TOKEN B have been approved");
    } catch (e) {
      console.log("ERROR: While Approving Tokens (line: 5393)");
      console.log(e);
    }
  });

  setTimeout(async () => {
    try {
      await router.methods
        .addLiquidityETH(
          TokenA.networks[id].address,
          web3.utils.toWei("10000"),
          0,
          0,
          addresses[2],
          Math.floor(Date.now() / 1000) + 60 * 10
        )
        .send({ from: addresses[2], gas: gas, value: web3.utils.toWei("10") });
      console.log("Added liquidity to WETH - TKA ");

      let lp_add_ = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();

      const swapPair_ = new web3.eth.Contract(Pair.abi, lp_add_);

      const some = await swapPair_.methods.getReserves().call();
      const lastK = await swapPair_.methods.kLast().call();

      const rootk = Math.sqrt(some[0] * some[1]);
      const rootklast = Math.sqrt(lastK);

      console.log(`
      Pair ETH - A:

      Reserve0 = ${web3.utils.fromWei(some[0])}
      Reserve1 = ${web3.utils.fromWei(some[1])}

      rootK     =  ${rootk}
      rootKLast =  ${rootklast}
      `);

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

      await router.methods
        .addLiquidityETH(
          TokenB.networks[id].address,
          web3.utils.toWei("10000"),
          0,
          0,
          addresses[2],
          Math.floor(Date.now() / 1000) + 60 * 10
        )
        .send({ from: addresses[2], gas: gas, value: web3.utils.toWei("30") });
      console.log("Added liquidity to WETH - TKB ");

      await router.methods
        .addLiquidity(
          TokenA.networks[id].address,
          TokenB.networks[id].address,
          web3.utils.toWei("1000"),
          web3.utils.toWei("1000"),
          0,
          0,
          addresses[2],
          Math.floor(Date.now() / 1000) + 60 * 10
        )
        .send({ from: addresses[2], gas: gas });
      console.log("Added liquidity to TKA - TKB ");

      const postAddLiquidityTokenA = await tokenA.methods
        .balanceOf(addresses[2])
        .call();
      const postAddLiquidityTokenB = await tokenB.methods
        .balanceOf(addresses[2])
        .call();

      console.log(`
ADD[2]: ${web3.utils.fromWei(postAddLiquidityTokenA)} TKA
ADD[2]: ${web3.utils.fromWei(postAddLiquidityTokenB)} TKB

`);

      const llp_WETH_A = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();

      const pair = new web3.eth.Contract(Pair.abi, llp_WETH_A);

      const add2balanceLP = await pair.methods.balanceOf(addresses[2]).call();
      console.log("ADDRESS_2 (WETH-TKA LP) WEI format", add2balanceLP);
      console.log(
        "ADDRESS_2 (WETH-TKA LP) No WEI format",
        web3.utils.fromWei(add2balanceLP)
      );

    } catch (e) {
      console.log("ERROR: While Adding Liquidity ");
      console.log(e);
    }
  }, 10 * 1000);

  setTimeout(async () => {
    //? Get Reserve INFORMATION
    try {
      lp_weth_tka = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();
      console.log(`ETH - Token A LP address: ${lp_weth_tka}`);
      const pair = new web3.eth.Contract(Pair.abi, lp_weth_tka);
      const token0 = await pair.methods.token0().call();
      const token1 = await pair.methods.token1().call();

      console.log(`
      Token 0: ${token0}
      Token 1: ${token1}
      `);

      const reserve = await pair.methods.getReserves().call();

      console.log(`
      Reserve Token 0: ${web3.utils.fromWei(reserve._reserve0)}
      Reserve Token 1: ${web3.utils.fromWei(reserve._reserve1)}
      `);

      lp_weth_tkb = await factory.methods
        .getPair(WETH.networks[id].address, TokenB.networks[id].address)
        .call();
      console.log(`ETH - Token B LP address: ${lp_weth_tkb}`);
      const _pair = new web3.eth.Contract(Pair.abi, lp_weth_tkb);
      const _token0 = await _pair.methods.token0().call();
      const _token1 = await _pair.methods.token1().call();

      console.log(`
      Token 0: ${_token0}
      Token 1: ${_token1}
      `);

      const _reserve = await _pair.methods.getReserves().call();

      console.log(`
      Reserve Token 0: ${web3.utils.fromWei(_reserve._reserve0)}
      Reserve Token 1: ${web3.utils.fromWei(_reserve._reserve1)}
      `);

      lp_tka_tkb = await factory.methods
        .getPair(TokenA.networks[id].address, TokenB.networks[id].address)
        .call();
      console.log(`Token A - Token B LP address: ${lp_tka_tkb}`);
      const __pair = new web3.eth.Contract(Pair.abi, lp_tka_tkb);
      const __token0 = await __pair.methods.token0().call();
      const __token1 = await __pair.methods.token1().call();

      console.log(`
      Token A: ${__token0}
      Token B: ${__token1}
      `);

      const __reserve = await __pair.methods.getReserves().call();

      console.log(`
      Reserve Token 0: ${web3.utils.fromWei(__reserve._reserve0)}
      Reserve Token 1: ${web3.utils.fromWei(__reserve._reserve1)}
      `);
    } catch (e) {
      console.log("ERROR: While Getting Pair Data");
      console.log(e);
    }
  }, 20 * 1000);

  //* SWAP ETH --> TKA (1)
  setTimeout(async () => {
    try {
      const amountOut_ETH_TKA = await router.methods
        .getAmountsOut(web3.utils.toWei("10"), [
          WETH.networks[id].address,
          TokenA.networks[id].address,
        ])
        .call({ from: addresses[3] });
      console.log(
        "I am swaping: ",
        web3.utils.fromWei(amountOut_ETH_TKA[0]),
        "wETH"
      );
      console.log("I will get: ", web3.utils.fromWei(amountOut_ETH_TKA[1]));

      const amountOut_ETH_TKA_min = web3.utils.fromWei(amountOut_ETH_TKA[1]);

      console.log("Or a MINIMUM : ", amountOut_ETH_TKA_min, "TKA");

      const balanceTKA_before = await tokenA.methods
        .balanceOf(addresses[3])
        .call({ from: addresses[3] });
      console.log(`
        Purchaser ADD[3] TKA Balance (before): ${web3.utils.fromWei(
          balanceTKA_before
        )} TKA
            `);

      const swap_amount = amountOut_ETH_TKA_min.toString();

      const preETHBal = await web3.eth.getBalance(addresses[3]);
      console.log(`ETH BALANCE (before): ${web3.utils.fromWei(preETHBal)} ETH`);
      console.log("Preparing swap ETH --> TKA");
      await router.methods
        .swapETHForExactTokens(
          web3.utils.toWei(swap_amount),
          [WETH.networks[id].address, TokenA.networks[id].address],
          addresses[3],
          Math.floor(Date.now() / 1000) + 60 * 10
        )
        .send({
          from: addresses[3],
          gas: gas,
          value: web3.utils.toWei("10"),
        });
      console.log("Done SWAP (ETH-TKA)");
      const balanceTKA_after = await tokenA.methods
        .balanceOf(addresses[3])
        .call({ from: addresses[3] });

      const postETHBal = await web3.eth.getBalance(addresses[3]);
      console.log(`ETH BALANCE (post): ${web3.utils.fromWei(postETHBal)} ETH`);
      console.log(`
            INFO: For 10 EWT
            Expecting AmountOutDesired: ${amountOut_ETH_TKA_min}
    Purchaser ADD[3] TKA Balance (after): ${web3.utils.fromWei(
      balanceTKA_after
    )} TKA
    `);

      let lp_add_ = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();

      const swapPair_ = new web3.eth.Contract(Pair.abi, lp_add_);

      const some = await swapPair_.methods.getReserves().call();
      const lastK = await swapPair_.methods.kLast().call();

      const rootk = Math.sqrt(some[0] * some[1]);
      const rootklast = Math.sqrt(lastK);

      console.log(`
    Pair ETH - A:

    Reserve0 = ${web3.utils.fromWei(some[0])}
    Reserve1 = ${web3.utils.fromWei(some[1])}

    rootK     =  ${rootk}
    rootKLast =  ${rootklast}
    `);

      let lp_add = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();

      const swapPair = new web3.eth.Contract(Pair.abi, lp_add);

      const kLast = await swapPair.methods.kLast().call();

      console.log(`
      After SWAP, Pair ETH-TKA kLast --> ${kLast}
    `);
    } catch (e) {
      console.log("ERROR: When trying SWAP ETH --> TKA");
      console.log(e);
    }
  }, 21 * 1000);

  setTimeout(async () => {
    try {
      const amountOut_ETH_TKA = await router.methods
        .getAmountsOut(web3.utils.toWei("25"), [
          WETH.networks[id].address,
          XdYe.networks[id].address,
        ])
        .call({ from: addresses[6] });
      console.log(
        "I am swaping: ",
        web3.utils.fromWei(amountOut_ETH_TKA[0]),
        "wETH"
      );
      console.log(
        "I will get: ",
        web3.utils.fromWei(amountOut_ETH_TKA[1]),
        " XDYE"
      );

      const amountOut_ETH_TKA_min =
        web3.utils.fromWei(amountOut_ETH_TKA[1]) * 0.8;

      console.log("Or a MINIMUM : ", amountOut_ETH_TKA_min, "XDYE");

      const balanceTKA_before = await xdye.methods
        .balanceOf(addresses[6])
        .call({ from: addresses[6] });
      console.log(`
        Purchaser ADD[3] TKA Balance (before): ${web3.utils.fromWei(
          balanceTKA_before
        )} XDYE
            `);

      const swap_amount = amountOut_ETH_TKA_min.toString();

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
      const balanceXDYE_after = await tokenA.methods
        .balanceOf(addresses[6])
        .call({ from: addresses[6] });

      const postETHBal = await web3.eth.getBalance(addresses[6]);
      console.log(`ETH BALANCE (post): ${web3.utils.fromWei(postETHBal)} ETH`);
      console.log(`
            INFO: For 25 ETH
            Expecting AmountOutDesired: ${amountOut_ETH_TKA_min}
    Purchaser ADD[3] XDYE Balance (after): ${web3.utils.fromWei(
      balanceXDYE_after
    )} TKA
    `);

      let lp_add_ = await factory.methods
        .getPair(WETH.networks[id].address, XdYe.networks[id].address)
        .call();

      const swapPair_ = new web3.eth.Contract(Pair.abi, lp_add_);

      const some = await swapPair_.methods.getReserves().call();
      const lastK = await swapPair_.methods.kLast().call();

      const rootk = Math.sqrt(some[0] * some[1]);
      const rootklast = Math.sqrt(lastK);

      console.log(`
    Pair ETH - XDYE:

    Reserve0 = ${web3.utils.fromWei(some[0])}
    Reserve1 = ${web3.utils.fromWei(some[1])}

    rootK     =  ${rootk}
    rootKLast =  ${rootklast}
    `);

      let lp_add = await factory.methods
        .getPair(WETH.networks[id].address, XdYe.networks[id].address)
        .call();

      const swapPair = new web3.eth.Contract(Pair.abi, lp_add);

      const kLast = await swapPair.methods.kLast().call();

      console.log(`
      After SWAP, Pair ETH-XDYE kLast --> ${kLast}
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

    const postXdYeInWallet = await xdye.methods.balanceOf(addresses[3]).call();

    console.log(`
    
    -- Interacting with XDYE BAR --
    
    ADD[3] (XDYE Balance PreDeposit on BAR): ${web3.utils.fromWei(
      xdyeInWallet
    )} XDYE

    ADD[3] (XDYE Balance PostDeposit on BAR): ${web3.utils.fromWei(
      postXdYeInWallet
    )} XDYE

    `);
  }, 26 * 1000);

  //* SWAP TKA --> TKB (2)
  setTimeout(async () => {
    try {
      const tka_balance_init = await tokenA.methods
        .balanceOf(addresses[3])
        .call();

      const tkb_balance_init = await tokenB.methods
        .balanceOf(addresses[3])
        .call();

      const amountOut_TKA_TKB = await router.methods
        .getAmountsOut(tka_balance_init, [
          TokenA.networks[id].address,
          TokenB.networks[id].address,
        ])
        .call({ from: addresses[3] });

      const amountOut_TKA_TKB_min =
        web3.utils.fromWei(amountOut_TKA_TKB[1]) * 0.8;

      await tokenA.methods
        .approve(
          Router.networks[id].address,
          web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
        )
        .send({
          from: addresses[3],
          gas: gas,
        });

      await router.methods
        .swapTokensForExactTokens(
          amountOut_TKA_TKB[1],
          tka_balance_init,
          [TokenA.networks[id].address, TokenB.networks[id].address],
          addresses[3],
          Math.floor(Date.now() / 1000) + 60 * 10
        )
        .send({
          from: addresses[3],
          gas: gas,
        });

      console.log("SWAP_1");

      const balanceTKB_after = await tokenB.methods
        .balanceOf(addresses[3])
        .call({ from: addresses[3] });
      const balanceTKA_after = await tokenA.methods
        .balanceOf(addresses[3])
        .call({ from: addresses[3] });

      console.log(`
        
        SUMMARY: Trading TKA --> TKB

          TKA Balance (pre): ${web3.utils.fromWei(tka_balance_init)} TKA
          TKB Balance (pre): ${web3.utils.fromWei(tkb_balance_init)} TKB

          After Trading
          -------------

          TKA Balance (post): ${web3.utils.fromWei(balanceTKA_after)} TKA
          TKB Balance (post): ${web3.utils.fromWei(balanceTKB_after)} TKB
          
        
        
        
        `);

      let lp_add_ = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();

      const swapPair_ = new web3.eth.Contract(Pair.abi, lp_add_);

      const some = await swapPair_.methods.getReserves().call();
      const lastK = await swapPair_.methods.kLast().call();

      const rootk = Math.sqrt(some[0] * some[1]);
      const rootklast = Math.sqrt(lastK);

      console.log(`
    Pair ETH - A:

    Reserve0 = ${web3.utils.fromWei(some[0])}
    Reserve1 = ${web3.utils.fromWei(some[1])}

    rootK     =  ${rootk}
    rootKLast =  ${rootklast}
    `);

      let lp_add = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();

      const swapPair = new web3.eth.Contract(Pair.abi, lp_add);

      const kLast = await swapPair.methods.kLast().call();

      console.log(`
      After SWAP, Pair ETH-TKA kLast --> ${kLast}
    `);
    } catch (e) {
      console.log("ERROR: When trying SWAP ETH --> TKA");
      console.log(e);
    }
  }, 26 * 1000);

  setTimeout(async () => {
    //! Remove Liquidity (because TradingFees are minted when user ADDs/Withdraws Liquidity)

    try {
      const llp_WETH_A = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();

      console.log(`Removing Liquidity of: ${llp_WETH_A}`);

      const token_llp = new web3.eth.Contract(UniswapV2ERC20.abi, llp_WETH_A);

      const user_balance_token_llp = await token_llp.methods
        .balanceOf(addresses[2])
        .call();

      const pair_eth_a = new web3.eth.Contract(Pair.abi, llp_WETH_A);

      const pairData = await pair_eth_a.methods.getReserves().call();
      console.log(`
    Pair Data:
      - Token0 (${web3.utils.fromWei(pairData._reserve0)})  
      - Token1 (${web3.utils.fromWei(pairData._reserve1)})

    `);

      let ewt_reserve;
      let tka_reserve;

      if (pairData.token0 == WETH.networks[id].address) {
        ewt_reserve = web3.utils.fromWei(pairData._reserve0);
        tka_reserve = web3.utils.fromWei(pairData._reserve1);
      } else {
        tka_reserve = web3.utils.fromWei(pairData._reserve0);
        ewt_reserve = web3.utils.fromWei(pairData._reserve1);
      }

      console.log(`
    
    
    `);

      console.log(`
    ADD[3] has ${web3.utils.fromWei(user_balance_token_llp)} ETH-A LP 
    `);

      //? Data for ANAL Remove Liquidity

      const balanceToken0 = await tokenA.methods.balanceOf(llp_WETH_A).call();
      const balanceToken1 = await weth.methods.balanceOf(llp_WETH_A).call();

      const balance = await pair_eth_a.methods.balanceOf(addresses[2]).call();
      const _balance = await token_llp.methods.balanceOf(addresses[2]).call();

      const totalS = await pair_eth_a.methods.totalSupply().call();

      let withAmount = web3.utils.fromWei(_balance) * 0.5;

      console.log("No Wei: ", withAmount);

      //? (End) Data for ANAL Remove Liquidity
      const bnRemove = "100";

      const approved = await pair_eth_a.methods
        .approve(
          Router.networks[id].address,
          web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
        )
        .send({
          from: addresses[2],
          gas: gas,
        });

      console.log('Approved ETH-TKA LP "manipulation"');

      //? EXTRA
      const liquidity = await pair_eth_a.methods.balanceOf(llp_WETH_A).call();

      console.log(liquidity);
      console.log(web3.utils.fromWei(liquidity));
      //?
      amount = web3.utils.toWei(withAmount.toString(), "ether");

      await router.methods
        .removeLiquidityETH(
          TokenA.networks[id].address,
          amount,
          0,
          0,
          addresses[2],
          Math.floor(Date.now() / 1000) + 60 * 10
        )
        .send({ from: addresses[2], gas: gas });

      console.log("Could Remove (50%) Liquidity ETH-TKA");

      const endBal = await token_llp.methods.balanceOf(addresses[2]).call();
      console.log(`User has: ${web3.utils.fromWei(endBal)} ETH-TKA LP`);
    } catch (e) {
      console.log("ERROR: Removing Liquidity For ETH-TKA");
      console.log(e);
    }
  }, 35 * 1000);

  setTimeout(async () => {
    //! Remove Liquidity (because TradingFees are minted when user ADDs/Withdraws Liquidity)

    try {
      const llp_WEWT_A = await factory.methods
        .getPair(WETH.networks[id].address, XdYe.networks[id].address)
        .call();

      console.log(`Removing Liquidity of: ${llp_WEWT_A}`);

      const token_llp = new web3.eth.Contract(UniswapV2ERC20.abi, llp_WEWT_A);

      const user_balance_token_llp = await token_llp.methods
        .balanceOf(addresses[2])
        .call();

      const pair_ewt_a = new web3.eth.Contract(Pair.abi, llp_WEWT_A);

      const _balance = await token_llp.methods.balanceOf(addresses[2]).call();

      let withAmount = web3.utils.fromWei(_balance) * 0.5;

      const bnRemove = "100";

      const approved = await pair_ewt_a.methods
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
      const liquidity = await pair_ewt_a.methods.balanceOf(llp_WEWT_A).call();

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
      console.log("ERROR: Removing Liquidity on Pair ETH-XDYE");
      console.log(e);
    }
  }, 37 * 1000);

  setTimeout(async () => {
    //! Remove Liquidity (because TradingFees are minted when user ADDs/Withdraws Liquidity)

    try {
      const llp_WEWT_A = await factory.methods
        .getPair(TokenA.networks[id].address, TokenB.networks[id].address)
        .call();

      console.log(`Removing Liquidity of: ${llp_WEWT_A}`);

      const token_llp = new web3.eth.Contract(UniswapV2ERC20.abi, llp_WEWT_A);

      const pair_eth_a = new web3.eth.Contract(Pair.abi, llp_WEWT_A);

      const _balance = await token_llp.methods.balanceOf(addresses[2]).call();

      let withAmount = web3.utils.fromWei(_balance) * 0.5;

      // withAmount = Math.trunc(withAmount).toString()

      console.log("No Wei: ", withAmount);

      //? (End) Data for ANAL Remove Liquidity
      const bnRemove = "100";

      const approved = await pair_eth_a.methods
        .approve(
          Router.networks[id].address,
          web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
        )
        .send({
          from: addresses[2],
          gas: gas,
        });

      console.log('Approved TKA-TKB LP "manipulation"');

      //? EXTRA
      const liquidity = await pair_eth_a.methods.balanceOf(llp_WEWT_A).call();

      console.log(liquidity);
      console.log(web3.utils.fromWei(liquidity));
      //?
      amount = web3.utils.toWei(withAmount.toString(), "ether");

      await router.methods
        .removeLiquidity(
          TokenA.networks[id].address,
          TokenB.networks[id].address,
          amount,
          0,
          0,
          addresses[2],
          Math.floor(Date.now() / 1000) + 60 * 10
        )
        .send({ from: addresses[2], gas: gas });

      console.log("Could Remove (50%) Liquidity TKA-TKB");

      const endBal = await token_llp.methods.balanceOf(addresses[2]).call();
      console.log(`User has: ${web3.utils.fromWei(endBal)} TKA-TKB LP`);
    } catch (e) {
      console.log("ERROR: Removing Liquidity TKA-TKB");
      console.log(e);
    }
  }, 39 * 1000);

  setTimeout(async () => {
    try {
      await xdyeMaker.methods
        .convert(WETH.networks[id].address, TokenA.networks[id].address)
        .send({
          from: addresses[4],
          gas: gas,
        });
      console.log("Could Execute: XDYE Maker convert() ");
    } catch (e) {
      console.log("FAILED ON XDYE MAKER CONVERT");
      console.log(e);
    }
  }, 44 * 1000);

  setTimeout(async () => {
    try {
      await xdyeMaker.methods
        .convert(TokenA.networks[id].address, TokenB.networks[id].address)
        .send({
          from: addresses[5],
          gas: gas,
        });
      console.log("Could Execute: XDYE Maker convert() ");
    } catch (e) {
      console.log("FAILED ON XDYE MAKER CONVERT");
      console.log(e);
    }
  }, 46 * 1000);

  setTimeout(async () => {
    try {
      await xdyeMaker.methods
        .convert(WETH.networks[id].address, XdYe.networks[id].address)
        .send({
          from: addresses[5],
          gas: gas,
        });
      console.log("Could Execute: XDYE Maker convert() ");
    } catch (e) {
      console.log("FAILED ON XDYE MAKER CONVERT");
      console.log(e);
    }
  }, 48 * 1000);

  //! XdYe Bar (User approach) deposit XDYE --> get xXDYE, then xXDYE to XDYE (increase XDYE amount)

  //! Check if SYST. ARQUITECTURE worked

  setTimeout(async () => {
    try {
      const add3_xdye_in_bar = await xdyeBar.methods
        .balanceOf(addresses[3])
        .call();
      await xdyeBar.methods
        .leave(add3_xdye_in_bar)
        .send({ from: addresses[3], gas: gas });

      console.log("✅ Could leave XDYE Bar");

      const xdyePostBar = await xdye.methods.balanceOf(addresses[3]).call();

      console.log(`
      
      _ Post XDYE Bar Summary _

      ADD[3]:  ${web3.utils.fromWei(xdyePostBar)} XDYE        
      
      `);
    } catch (e) {
      console.log("ERROR: While checking FINAL DATA");
      console.log(e);
    }
  }, 50 * 1000);

  setTimeout(async () => {
    try {
      const addressPair = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();
      const addressPair_1 = await factory.methods
        .getPair(WETH.networks[id].address, XdYe.networks[id].address)
        .call();
      const addressPair_2 = await factory.methods
        .getPair(WETH.networks[id].address, TokenB.networks[id].address)
        .call();
      const addressPair_3 = await factory.methods
        .getPair(TokenA.networks[id].address, TokenB.networks[id].address)
        .call();
      const ewt_tka_lp_contract = new web3.eth.Contract(tokenABI, addressPair);
      const ewt_xdye_lp_contract = new web3.eth.Contract(
        tokenABI,
        addressPair_1
      );
      const ewt_tkb_lp_contract = new web3.eth.Contract(
        tokenABI,
        addressPair_2
      );
      const tka_tkb_lp_contract = new web3.eth.Contract(
        tokenABI,
        addressPair_3
      );

      
      const xdyeMaker_xdye = await xdye.methods
        .balanceOf(XdYeMaker.networks[id].address)
        .call();
      const xdyeMaker_ewt = await web3.eth.getBalance(
        XdYeMaker.networks[id].address
      );
      const xdyeMaker_wewt = await weth.methods
        .balanceOf(XdYeMaker.networks[id].address)
        .call();
      const xdyeMaker_ewt_tka_lp = await ewt_tka_lp_contract.methods
        .balanceOf(XdYeMaker.networks[id].address)
        .call();
      const xdyeMaker_ewt_xdye_lp = await ewt_xdye_lp_contract.methods
        .balanceOf(XdYeMaker.networks[id].address)
        .call();
      const xdyeMaker_ewt_tkb_lp = await ewt_tkb_lp_contract.methods
        .balanceOf(XdYeMaker.networks[id].address)
        .call();
      const xdyeMaker_tka_tkb_lp = await tka_tkb_lp_contract.methods
        .balanceOf(XdYeMaker.networks[id].address)
        .call();

      console.log(`
      
      _ XdYe Maker Summary _

      XdYeMaker ADD: ${web3.utils.fromWei(xdyeMaker_ewt_tka_lp)} LP (ETH-TKA)
      XdYeMaker ADD: ${web3.utils.fromWei(
        xdyeMaker_ewt_xdye_lp
      )} LP (ETH-XDYE)
      XdYeMaker ADD: ${web3.utils.fromWei(xdyeMaker_ewt_tkb_lp)} LP (ETH-TKB)
      XdYeMaker ADD: ${web3.utils.fromWei(xdyeMaker_tka_tkb_lp)} LP (TKA-TKB)
      XdYeMaker ADD: ${web3.utils.fromWei(xdyeMaker_xdye)} XDYE        
      XdYeMaker ADD: ${web3.utils.fromWei(xdyeMaker_wewt)} WETH 
      XdYeMaker ADD: ${web3.utils.fromWei(xdyeMaker_ewt)} ETH (real Profit)
      
      `);

      const xdyeBar_xdye = await xdye.methods
        .balanceOf(XdYeBar.networks[id].address)
        .call();
      const xdyeBar_ewt = await web3.eth.getBalance(
        XdYeBar.networks[id].address
      );
      const xdyeBar_wewt = await weth.methods
        .balanceOf(XdYeBar.networks[id].address)
        .call();
      const xdyeBar_ewt_tka_lp = await ewt_tka_lp_contract.methods
        .balanceOf(XdYeBar.networks[id].address)
        .call();

      console.log(`
      
      _ XdYe Bar Summary _

      XdYeBar ADD: ${web3.utils.fromWei(xdyeBar_ewt_tka_lp)} LP (ETH-TKA)
      XdYeBar ADD: ${web3.utils.fromWei(xdyeBar_xdye)} XDYE        
      XdYeBar ADD: ${web3.utils.fromWei(xdyeBar_wewt)} WETH 
      XdYeBar ADD: ${web3.utils.fromWei(xdyeBar_ewt)} ETH (real Profit)
      
      `);
    } catch (e) {
      console.log("ERROR: While checking FINAL DATA");
      console.log(e);
    }
  }, 55 * 1000);
};

checkEverythingIsWorkingOnXdYe();
