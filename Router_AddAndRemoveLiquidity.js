const Web3 = require("web3");

const Factory = require("./src/abis/UniswapV2Factory.json");
const Router = require("./src/abis/UniswapV2Router02.json");
const WETH = require("./src/abis/WETH.json");
const TokenA = require("./src/abis/ERC20Creator.json");
const TokenB = require("./src/abis/ERC20Creator1.json");


const addAndRemoveLiquidity = async () => {
  const web3 = new Web3("http://localhost:8545");

  const id = await web3.eth.net.getId();
  console.log(id);

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

  const wETH = new web3.eth.Contract(WETH.abi, WETH.networks[id].address);

  let llp_tokenA_tokenB;

  try {
    //! Send TOKEN A and TOKEN B to ADD[2] so it can provide Liquidity

    const balTokenA2 = await tokenA.methods.balanceOf(addresses[0]).call();
    const balTokenB2 = await tokenB.methods.balanceOf(addresses[0]).call();

    await tokenA.methods.transfer(addresses[2], bn).send({
      from: addresses[0],
      gas: gas,
    });
    await tokenB.methods.transfer(addresses[2], bn).send({
      from: addresses[0],
      gas: gas,
    });

    const preAddLiquidityTokenA = await tokenA.methods
      .balanceOf(addresses[2])
      .call();
    const preAddLiquidityTokenB = await tokenB.methods
      .balanceOf(addresses[2])
      .call();

    console.log(`

    Balances PRE - ADDING LIQUIDITY

ADD[2]: ${web3.utils.fromWei(preAddLiquidityTokenA)} TKA
ADD[2]: ${web3.utils.fromWei(preAddLiquidityTokenB)} TKB

`);
  } catch (e) {
    console.log("ERROR: While sending Token A and Token B");
    console.log(e);
  }

  //! Approving Router to spend Token A and Token B from addresses[2]
  setTimeout(async () => {
    try {
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

      console.log("TOKEN A , TOKEN B have been approved");
    } catch (e) {
      console.log("ERROR: While Approving TKA & TKB for ADD[2]");
      console.log(e);
    }
  });

  //! Creating a Pair through Router with addLiquidity
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
      Pair wETH - A:

      Reserve0 = ${web3.utils.fromWei(some[0])}
      Reserve1 = ${web3.utils.fromWei(some[1])}

      rootK     =  ${rootk}
      rootKLast =  ${rootklast}
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

      Balances POST - ADDING LIQUIDITY

ADD[2]: ${web3.utils.fromWei(postAddLiquidityTokenA)} TKA
ADD[2]: ${web3.utils.fromWei(postAddLiquidityTokenB)} TKB

`);

      const llp_WETH_A = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();

      const pair = new web3.eth.Contract(Pair.abi, llp_WETH_A);

      const add2balanceLP = await pair.methods.balanceOf(addresses[2]).call();
      console.log("ADDRESS_2 LPs (wETH - A) in WEI format", add2balanceLP);
      console.log(
        "ADDRESS_2 LPs (wETH - A) NO WEI format",
        web3.utils.fromWei(add2balanceLP)
      );

      // console.log(dataReturnedAddLiquidity)
    } catch (e) {
      console.log("ERROR: While Adding Liquidity to PAIR (A-B)");
      console.log(e);
    }
  }, 10 * 1000);

  //! Get Reserve INFORMATION
  setTimeout(async () => {
    try {
      lp_weth_tka = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();
      console.log(`WETH - Token A LP address: ${lp_weth_tka}`);
      const pair = new web3.eth.Contract(Pair.abi, lp_weth_tka);
      const token0 = await pair.methods.token0().call();
      const token1 = await pair.methods.token1().call();

      console.log(`
      Pair Information: (wETH-TKA)

      Token 0: ${token0}
      Token 1: ${token1}
      `);

      const reserve = await pair.methods.getReserves().call();

      console.log(`
      Reserves on Pair wETH - Token B:

      Reserve Token 0: ${web3.utils.fromWei(reserve._reserve0)}
      Reserve Token 1: ${web3.utils.fromWei(reserve._reserve1)}
      `);

      lp_weth_tkb = await factory.methods
        .getPair(WETH.networks[id].address, TokenB.networks[id].address)
        .call();
      console.log(`EWT - Token B LP address: ${lp_weth_tkb}`);
      const _pair = new web3.eth.Contract(Pair.abi, lp_weth_tkb);
      const _token0 = await _pair.methods.token0().call();
      const _token1 = await _pair.methods.token1().call();

      console.log(`

      Pair Information: (wETH-TKB)

      Token 0: ${_token0}
      Token 1: ${_token1}
      `);

      const _reserve = await _pair.methods.getReserves().call();

      console.log(`
      Reserves on Pair wETH - Token B:

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
      Pair Information: (TKA-TKB)

      Token 0: ${__token0}
      Token 1: ${__token1}
      `);

      const __reserve = await __pair.methods.getReserves().call();

      console.log(`
      Reserves on Pair Token A - Token B:

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
        "wETH",
        WETH_ADDRESS
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
      console.log(" ");
      console.log("SWAP_0");
      console.log(" ");

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
      const balanceTKA_after = await tokenA.methods
        .balanceOf(addresses[3])
        .call({ from: addresses[3] });

      const postETHBal = await web3.eth.getBalance(addresses[3]);
      console.log(`ETH BALANCE (post): ${web3.utils.fromWei(postETHBal)} ETH`);
      console.log(`
        Trade INFO: For 10 ETH
        
        Purchaser ADD[3] TKA Balance (after): ${web3.utils.fromWei(
          balanceTKA_after
        )} TKA
          `);
      console.log("Done SWAP (ETH-TKA)");

      let lp_add_ = await factory.methods
        .getPair(WETH.networks[id].address, TokenA.networks[id].address)
        .call();

      const swapPair_ = new web3.eth.Contract(Pair.abi, lp_add_);

      const some = await swapPair_.methods.getReserves().call();
      const lastK = await swapPair_.methods.kLast().call();

      const rootk = Math.sqrt(some[0] * some[1]);
      const rootklast = Math.sqrt(lastK);

      console.log(`
    Pair ETH - Token A: (post trade)

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
        .getPair(TokenA.networks[id].address, TokenB.networks[id].address)
        .call();

      const swapPair_ = new web3.eth.Contract(Pair.abi, lp_add_);

      const some = await swapPair_.methods.getReserves().call();
      const lastK = await swapPair_.methods.kLast().call();

      const rootk = Math.sqrt(some[0] * some[1]);
      const rootklast = Math.sqrt(lastK);

      console.log(`
    Pair A - B:

    Reserve0 = ${web3.utils.fromWei(some[0])}
    Reserve1 = ${web3.utils.fromWei(some[1])}

    rootK     =  ${rootk}
    rootKLast =  ${rootklast}
    `);
    } catch (e) {
      console.log("ERROR: When trying SWAP TKA --> TKB");
      console.log(e);
    }
  }, 26 * 1000);

  //

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

      console.log(`
    ADD[3] has ${web3.utils.fromWei(user_balance_token_llp)} (ETH - A) LP 
    `);

      const balanceToken0 = await tokenA.methods.balanceOf(llp_WETH_A).call();
      const balanceToken1 = await wETH.methods.balanceOf(llp_WETH_A).call();

      const balance = await pair_eth_a.methods.balanceOf(addresses[2]).call();
      const _balance = await token_llp.methods.balanceOf(addresses[2]).call();

      const totalS = await pair_eth_a.methods.totalSupply().call();

      let withAmount = web3.utils.fromWei(_balance) * 0.5;

      console.log(
        "Amount to withdraw No Wei: ",
        withAmount,
        " LP (50%  of deposited LPs)"
      );

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
      console.log(`User has: ${web3.utils.fromWei(endBal)} EWT-TKA LP`);
      console.log(`
      
      `);
    } catch (e) {
      console.log("ERROR: Removing Liquidity");
      console.log(e);
    }
  }, 35 * 1000);
};

addAndRemoveLiquidity();
