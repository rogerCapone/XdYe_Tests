const Web3 = require("web3");
const Unlock = require("./src/abis/FarmUnlockerXdyeEth.json");


const checkUnlocker = async () => {
  const web3 = new Web3("http://localhost:8545");

  const id = await web3.eth.net.getId();

  const addresses = await web3.eth.getAccounts();

  const gas = new web3.utils.BN("6000000");

  const unlock = new web3.eth.Contract(Unlock.abi, Unlock.networks[id].address);

  try {
    const result = await unlock.methods.unlockList(addresses[2]).call();
    console.log(`
    Before paying Fee, XdYe Unlock Contract response:
    ${result}
    `);
    await unlock.methods.unlock().send({
      from: addresses[2],
      value: web3.utils.toWei("0.5"),
      gas: gas,
    });
    console.log(`
    ADD[2] has paied 0.5 ETH
    `);
    const result2 = await unlock.methods.unlockList(addresses[2]).call();
    console.log(`
    After paying Fee, XdYe Unlock Contract response:
    ${result2}
    `);

    const ethBal = await web3.eth.getBalance(addresses[9]);

    console.log(`
    
    ADD[9] is the receiver of Unlock Fees: 
    ETH Balance: ${web3.utils.fromWei(ethBal) - 100}
    
    `);
  } catch (e) {
    console.log(e);
  }

};

checkUnlocker();
