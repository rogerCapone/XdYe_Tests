const Web3 = require("web3");
const XdYe = require("./src/abis/XdYeToken.json");
const XdYeBar = require("./src/abis/XdYeBar.json");


const barTesting = async () => {
  const web3 = new Web3("http://localhost:8545");

  const id = await web3.eth.net.getId();
  console.log(id);

  const addresses = await web3.eth.getAccounts();

  const gas = new web3.utils.BN("6000000");


  const bn = new web3.utils.BN("100000000000000000000000"); //? 10,000
  const bn2 = new web3.utils.BN("100000000000000000000"); //? 100

  const xdye = new web3.eth.Contract(XdYe.abi, XdYe.networks[id].address);
  const xdyeBar = new web3.eth.Contract(
    XdYeBar.abi,
    XdYeBar.networks[id].address
  );

  try {
    const xdyeBal = await xdye.methods.balanceOf(addresses[2]).call();

    const owner = await xdye.methods.owner().call();

    await xdye.methods.mint(addresses[2], bn).send({
      from: owner,
      gas: gas,
    });
    await xdye.methods.mint(addresses[2], bn).send({
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
    await xdye.methods.transfer(addresses[3], bn).send({
      from: addresses[2],
      gas: gas,
    });

    console.log(`
    
    Transfered ${web3.utils.fromWei(bn)} XDYE from ADD[2] --> ADD[3]:

    `);
  } catch (e) {
    console.log("ERROR: While sending XDYE from ADD[2] --> ADD[3]");
    console.log(e);
  }

  setTimeout(async () => {
    try {
      await xdye.methods
        .approve(
          XdYeBar.networks[id].address,
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

      console.log("XDYE approved for ADD[2] & ADD[3]");
    } catch (e) {
      console.log("ERROR: Couldn't approved XDYE for ADD[2] & ADD[3]");
      console.log(e);
    }
  });

  setTimeout(async () => {
    const bal2 = await xdye.methods.balanceOf(addresses[2]).call();

    console.log(`ADD[2] (pre-deposit): ${web3.utils.fromWei(bal2)} XDYE`);

    await xdyeBar.methods.enter(bal2).send({
      from: addresses[2],
      gas: gas,
    });

    const bal = await xdye.methods.balanceOf(addresses[3]).call();

    console.log(`ADD[3] (pre-deposit): ${web3.utils.fromWei(bal)} XDYE`);

    await xdyeBar.methods.enter(bal).send({
      from: addresses[3],
      gas: gas,
    });

    const postBal2 = await xdye.methods.balanceOf(addresses[3]).call();
    console.log(`ADD[2] (post-deposit): ${web3.utils.fromWei(postBal2)} XDYE`);

    const postBal = await xdye.methods.balanceOf(addresses[3]).call();
    console.log(`ADD[3] (post-deposit): ${web3.utils.fromWei(postBal)} XDYE`);
  }, 5 * 1000);

  setTimeout(async () => {
    try {
      const barBalance = await xdye.methods
        .balanceOf(XdYeBar.networks[id].address)
        .call();

      const owner = await xdye.methods.owner().call();

      await xdye.methods.mint(XdYeBar.networks[id].address, bn).send({
        from: owner,
        gas: gas,
      });

      const barBalance_ = await xdye.methods
        .balanceOf(XdYeBar.networks[id].address)
        .call();

      console.log(`
      
      Sending XDYE to XdYe Bar Contract
  
      Pre_minting BAR: ${web3.utils.fromWei(barBalance)} XDYE
      Post_minting BAR: ${web3.utils.fromWei(barBalance_)} XDYE
  
      `);
    } catch (e) {
      console.log("ERROR: Miniting XDYEs");
      console.log(e);
    }
  }, 7 * 1000);


  setTimeout(async () => {
    const bal = await xdyeBar.methods.balanceOf(addresses[2]).call();
    console.log(`ADD[2] (pre-withdraw): ${web3.utils.fromWei(bal)} xXDYE`);
    const bal_ = await xdyeBar.methods.balanceOf(addresses[3]).call();
    console.log(`ADD[3] (pre-withdraw): ${web3.utils.fromWei(bal_)} xXDYE`);
  }, 10 * 1000);

  setTimeout(async () => {
    console.log(`ADD[2] is leaving XdYe Bar`);
    const bal = await xdyeBar.methods.balanceOf(addresses[2]).call();

    const withdrawAmount = await xdyeBar.methods.leave(bal).send({
      from: addresses[2],
      gas: gas,
    });

    const bal_ = await xdyeBar.methods.balanceOf(addresses[2]).call();
    const bal__ = await xdyeBar.methods.balanceOf(addresses[2]).call();

    console.log(`
    
    ADD[2] has removed: ${web3.utils.fromWei(bal)} xXDYE

    ADD[2] xXDYE balance: ${web3.utils.fromWei(bal_)} xXDYE
    ADD[2] XDYE balance (pre-bar): ${web3.utils.fromWei(bn)} XDYE
    ADD[2] XDYE balance (post-bar): ${web3.utils.fromWei(bal__)} XDYE
    
    `);
  }, 12 * 1000);

  setTimeout(async () => {
    console.log(`ADD[3] is leaving XdYe Bar`);
    const bal = await xdyeBar.methods.balanceOf(addresses[3]).call();

    const withdrawAmount = await xdyeBar.methods.leave(bal).send({
      from: addresses[3],
      gas: gas,
    });

    const bal_ = await xdyeBar.methods.balanceOf(addresses[3]).call();
    const bal__ = await xdye.methods.balanceOf(addresses[3]).call();

    console.log(`
    
    ADD[3] has removed: ${web3.utils.fromWei(bal)} xXDYE

    ADD[3] xXDYE balance: ${web3.utils.fromWei(bal_)} xXDYE
    ADD[3] XDYE balance (pre-bar): ${web3.utils.fromWei(bn)} XDYE
    ADD[3] XDYE balance (post-bar): ${web3.utils.fromWei(bal__)} XDYE
    
    `);
  }, 15 * 1000);
};

barTesting();
