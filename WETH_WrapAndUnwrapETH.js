const Web3 = require("web3");
const WETH = require("./src/abis/WETH.json");

const checkETHWrapAndUnwrap = async () => {
  const web3 = new Web3("http://localhost:8545");

  const id = await web3.eth.net.getId();
  console.log(id);

  const addresses = await web3.eth.getAccounts();

  const wETHContract = new web3.eth.Contract(
    WETH.abi,
    WETH.networks[id].address
  );

  try {
    const balanceWETHPre = await wETHContract.methods
      .balanceOf(addresses[0])
      .call();

    console.log(`
    
    Balance Pre Wrap:

    ADD[0]: ${web3.utils.fromWei(balanceWETHPre)} wETH
    
    `);

    await wETHContract.methods
      .deposit()
      .send({ from: addresses[0], value: web3.utils.toWei("10") });

    const balanceWETHPostWrap = await wETHContract.methods
      .balanceOf(addresses[0])
      .call();

    console.log(`
    
    Balance Post Wrap:

    ADD[0]: ${web3.utils.fromWei(balanceWETHPostWrap)} wETH
    
    `);

    await wETHContract.methods
      .withdraw(balanceWETHPostWrap)
      .send({ from: addresses[0] });

    const balanceWETHPostUnWrap = await wETHContract.methods
      .balanceOf(addresses[0])
      .call();

    console.log(`
  
  Balance Post UnWrap:

  ADD[0]: ${web3.utils.fromWei(balanceWETHPostUnWrap)} wETH
  
  `);
  } catch (e) {
    console.log(e);
    console.log("Something occured while wrapping or unwrapping ETH");
  }
};

checkETHWrapAndUnwrap();
