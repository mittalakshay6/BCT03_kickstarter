const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider({ gasLimit: "10000000" }));

const compiledFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");

let accounts;
let factory;
let campaignAddress;
let campaign;

// console.log(compiledFactory.evm.bytecode)

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  factory = await new web3.eth.Contract(compiledFactory.abi)
    .deploy({ data: compiledFactory.evm.bytecode.object })
    .send({ from: accounts[0], gas: "10000000" });

  console.log("Done");
  await factory.methods.createCampaign("100").send({
    from: accounts[0],
    gas: "10000000",
  });
  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();
  campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
});

describe("Campaigns", () => {
  it("deploy factory and campaign", () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });
  it("marks caller as campaign manager", async () => {
    const mgr = await campaign.methods.manager().call();
    assert.strictEqual(accounts[0], mgr);
  });
  it("allows people to contribute money and marks them as approver", async () => {
    await campaign.methods.contribute().send({
      value: "200",
      from: accounts[1],
    });
    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  });
  it("requires min contibution", async () => {
    try {
      await campaign.methods.contribute().send({
        value: "5",
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });
  it("allows mgr to make payment req", async () => {
    await campaign.methods.createRequest("Buy world", "100", accounts[1]).send({
      from: accounts[0],
      gas: "10000000",
    });
    const req = await campaign.methods.requests(0).call();
    // console.log(req)
    assert.strictEqual("Buy world", req.desc);
  });
  it("processes requests", async () => {
    await campaign.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei("10", "ether"),
    });
    await campaign.methods
      .createRequest(
        "Buy this world",
        web3.utils.toWei("5", "ether"),
        accounts[1]
      )
      .send({
        from: accounts[0],
        gas: "10000000",
      });
    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: "10000000",
    });
    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: "10000000",
    });
    let bal = await web3.eth.getBalance(accounts[1]);
    bal = web3.utils.fromWei(bal, "ether");
    bal = parseFloat(bal);
    assert(bal > 104)
  });
});
