var DutchAuction = artifacts.require("./DutchAuction.sol");

module.exports = function(deployer) {
  deployer.deploy(DutchAuction, 100, 50, 500000, 1);
};
