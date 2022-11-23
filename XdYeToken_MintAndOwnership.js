const Web3 = require("web3");
const XdYeToken = require("./src/abis/XdYeToken.json");


const xdyeTokenTest = async () => {
  const web3 = new Web3("http://localhost:8545");
  const id = await web3.eth.net.getId();

  const gas = new web3.utils.BN("6000000");

  const addresses = await web3.eth.getAccounts();

  console.log(`
  
  ADD[0]: ${addresses[0]}
  ADD[2]: ${addresses[2]}
  
  
  `);

  const xdye = new web3.eth.Contract(XdYeToken.abi, XdYeToken.networks[id].address);
  const owner = await xdye.methods.owner().call();

  console.log(`
  
  Initial XdYe Owner:

  ${owner}

  `);

  try {
    console.log("Minting 1,000 XdYe from ADD[0] --> ADD[3]");

    const preMintAdd3 = await xdye.methods.balanceOf(addresses[3]).call();
    console.log(`
    
    ADD[3] Balance Pre Minting: ${web3.utils.fromWei(preMintAdd3)} XdYe
    `);

    await xdye.methods
      .mint(addresses[3], web3.utils.toWei("1000"))
      .send({ from: addresses[0], gas: gas });

    const postMintAdd3 = await xdye.methods.balanceOf(addresses[3]).call();
    console.log(`
    
      ADD[3] Balance Post Minting: ${web3.utils.fromWei(postMintAdd3)} XdYe
      `);

    await xdye.methods.transferOwnership(addresses[2]).send({
      from: addresses[0],
      gas: gas,
    });

    const owner2 = await xdye.methods.owner().call();

    console.log(`

  XdYe Ownership is now:
    ${owner2}
  `);

    console.log(`
    
    Now trying to change XdYe Ownership from ADD[0], Tx should revert

    `);

    try {
      await xdye.methods.transferOwnership(addresses[3]).send({
        from: addresses[0],
        gas: gas,
      });
      console.log("⛔️ ADD[0] can change the Ownership ");
    } catch (e) {
      console.log("✅ ADD[0] can not change the Ownership ");
    }
  } catch (e) {
    console.log(e);
    console.log("Something occured while transfering Ownership");
  }
};

xdyeTokenTest();
