const Web3 = require("web3");
const Factory = require("./src/abis/UniswapV2Factory.json");
const WETH = require("./src/abis/WETH.json");
const TokenA = require("./src/abis/ERC20Creator.json");
const XdYe = require("./src/abis/XdYeToken.json");



const createPairOnXdYeFactory = async () => {
  const web3 = new Web3("http://localhost:8545");

  const id = await web3.eth.net.getId();

  const addresses = await web3.eth.getAccounts();

  const gas = new web3.utils.BN("6000000");

  const factory = new web3.eth.Contract(
    Factory.abi,
    Factory.networks[id].address
  );

  try {
    await factory.methods
      .createPair(TokenA.networks[id].address, XdYe.networks[id].address)
      .send({ from: addresses[0], gas: gas });
    console.log("Pair ToKen A - XdYe Created");
    
    await factory.methods
      .createPair(XdYe.networks[id].address, WETH.networks[id].address)
      .send({ from: addresses[0], gas: gas });
    console.log("Pair XdYe - WETH Created");
    
    await factory.methods
      .createPair(TokenA.networks[id].address, WETH.networks[id].address)
      .send({ from: addresses[0], gas: gas });
    console.log("Pair ToKen A - WETH Created");
    
  } catch (e) {
    console.log("Could not create pairs");
    console.log(e);
  }
};

createPairOnXdYeFactory();
