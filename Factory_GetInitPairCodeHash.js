const Web3 = require("web3");
const Factory = require("./src/abis/UniswapV2Factory.json");


const getFactoryInitPairCodeHash = async () => {
  const web3 = new Web3("http://localhost:8545");

  const id = await web3.eth.net.getId();

  const addresses = await web3.eth.getAccounts();

  const factory = new web3.eth.Contract(
    Factory.abi,
    Factory.networks[id].address
  );


  try {
    const init_pair_code_hash = await factory.methods.pairCodeHash().call();

    console.log("Factory Init Pair Code Hash: " + init_code_hash);

  } catch (e) {
    
    console.log(e);
    console.log("Something occured while fetching  INIT:PAIR:CODE:HASH");
  }
};

getFactoryInitPairCodeHash();
