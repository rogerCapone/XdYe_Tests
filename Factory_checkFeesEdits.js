const Web3 = require("web3");
const Factory = require("./src/abis/UniswapV2Factory.json");


const checkFactoryFeesEdit = async () => {
  const web3 = new Web3("http://localhost:8545");

  const id = await web3.eth.net.getId();

  const addresses = await web3.eth.getAccounts();

  const gas = new web3.utils.BN("6000000");

  const factory = new web3.eth.Contract(
    Factory.abi,
    Factory.networks[id].address
  );

  //? State 0
  //?   addresses[0] is feeToSetter
  //?   addresses[0] is feeTo

  try {
    //?   addresses[0] is feeToSetter
    await factory.methods
      .setFeeTo(addresses[1])
      .send({ from: addresses[0], gas: gas });

    console.log("Fees will be delivered to AD[1]");

    //? State 1
    //?   addresses[0] is feeToSetter
    //?   addresses[1] is feeTo

    await factory.methods
      .setFeeToSetter(addresses[1])
      .send({ from: addresses[0], gas: gas });

    console.log("Fees will be delivered to AD[1]");

    //? State 2
    //?   addresses[1] is feeToSetter
    //?   addresses[1] is feeTo

    //! Now addresses[0] can not change any information from XdYeFactory and neither receive LPs from XdYe Profits
    
  } catch (e) {
    console.log("Could not modify FeeTo or SetFeeToSetter pairs");
    console.log(e);
  }
};

checkFactoryFeesEdit();
