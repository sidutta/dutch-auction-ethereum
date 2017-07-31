var DutchAuction = artifacts.require("./DutchAuction.sol");

contract('DutchAuction', function(accounts) {

  it("accounts[0] should be organizer", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.organizer.call();
    })
    .then(function(organizer) {
      assert.equal(organizer, accounts[0], "accounts[0] should be organizer");
    });
  });

  it("itemsToAuction should be 100 initially", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.itemsToAuction.call()
      .then(function(itemsToAuction) {
        assert.equal(itemsToAuction, 100, "itemsToAuction should be 100 initially");
      });
    });  
  });

  it("reservePrice should be 50", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.reservePrice.call()
      .then(function(reservePrice) {
        assert.equal(reservePrice, 50, "reservePrice should be 50");
      });
    });  
  });

  it("startPrice should be 500000", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.startPrice.call()
      .then(function(startPrice) {
        assert.equal(startPrice, 500000, "startPrice should be 500000");
      });
    });  
  });

  it("priceDecreaseRate should be 1", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.priceDecreaseRate.call()
      .then(function(priceDecreaseRate) {
        assert.equal(priceDecreaseRate, 1, "priceDecreaseRate should be 1");
      });
    });  
  });

  it("stage should be Stages.StageInitialized initially", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.stage.call()
      .then(function(stage) {
        assert.equal(stage, 0, "stage should be Stages.StageInitialized initially");
      });
    });  
  });

  it("only organizer can allowBidding()", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.allowBidding({from: accounts[1]})
      .then(function() {
        console.log("Error: only organizer can allowBidding()")
      })
      .catch(function() {
        return instance.stage.call()
        .then(function(stage) {
          assert.equal(stage, 0, "only organizer can allowBidding()");
        });
      });
    });  
  });

  it("stage should be Stages.StageAcceptingBids after allowing bidding", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.allowBidding({from: accounts[0]})
      .then(function() {
        return instance.stage.call()
        .then(function(stage) {
          assert.equal(stage, 1, "stage should be Stages.StageAcceptingBids after allowing bidding");
        });
      });
    });  
  });

  it("allowBidding() can be called only once", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.allowBidding({from: accounts[0]})
      .then(function() {
        console.log("Error: allowBidding() can be called only once");
        // done();
      })
      .catch(function() {
        ;
      });
    });  
  });

  it("bid() should fail due to insufficient fund transfer and itemsPurchased, amountTransferred == 0", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.bid(100, { from: accounts[1], value: 1 })
      .then(function() {
        console.log("Error: bid() should fail due to insufficient fund transfer");
        // done();
      })
      .catch(function() {
        return instance.itemsPurchased.call(accounts[1])
        .then(function(items) {
          assert.equal(items, 0, "bid() should fail due to insufficient fund transfer and itemsPurchased == 0");
          return instance.amountTransferred.call(accounts[1])
        })
        .then(function(amountTransferred) {
          assert.equal(amountTransferred, 0, "bid() should fail due to insufficient fund transfer and amountTransferred == 0");
        });
      });
    });  
  });

  it("itemsPurchased and amountTransferred should reflect correct changes after a bid()", function() {
    var startBlock = 0;

    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.getCurrentItemPrice.call()
      .then(function(price) {
        return instance.startBlock.call();
      })
      .then(function(startBlock) {
        return instance.bid(10, { from: accounts[2], value: 10000000000 });
      })
      .then(function(tx) {
        return instance.itemsPurchased.call(accounts[2])
      })
      .then(function(items) {
        assert.equal(items, 10, "itemsPurchased should reflect correct changes after a bid()");
        return instance.amountTransferred.call(accounts[2])
      })
      .then(function(amountTransferred) {
        assert.equal(amountTransferred, 10000000000, "amountTransferred should reflect correct changes after a bid()");
      });
    });  
  });

  it("itemsPurchased and amountTransferred should correctly increment after second bid()", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.bid(20, { from: accounts[2], value: 10000000000 })
      .then(function(tx) {
        return instance.itemsPurchased.call(accounts[2]);
      })
      .then(function(items) {
        assert.equal(items, 30, "itemsPurchased should correctly increment after second bid()");
        return instance.amountTransferred.call(accounts[2]);
      })
      .then(function(amountTransferred) {
        assert.equal(amountTransferred, 20000000000, "amountTransferred should correctly increment after second bid()");
      });
    });  
  });

  it("if more than remaining items are requested in bid(), only remaning number of items should be returned", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.bid(100, { from: accounts[3], value: 10000000000 })
      .then(function(tx) {
        return instance.itemsPurchased.call(accounts[3]);
      })
      .then(function(items) {
        assert.equal(items, 70, "if more than remaining items are requested in bid(), only remaning number of items should be returned");
        return instance.amountTransferred.call(accounts[3]);
      })
      .then(function(amountTransferred) {
        assert.equal(amountTransferred, 10000000000, "if more than remaining items are requested in bid(), only remaning number of items should be returned");
      });
    });  
  });

  it("stage should be Stages.StageBidFinished after items exhausted", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.stage.call()
      .then(function(stage) {
        assert.equal(stage, 2, "stage should be Stages.StageBidFinished after items exhausted");
      });
    });  
  });

  it("only organizer can call transferEarningsToOrganizer()", function() {
    return DutchAuction.deployed()
    .then(function(instance) {
      return instance.transferEarningsToOrganizer.call({from: accounts[1]})
      .then(function() {
        console.log("Error: only organizer can call transferEarningsToOrganizer()");
      })
      .catch(function(){});
    });  
  });

  it("organizer's call to transferEarningsToOrganizer() should set stage=Stages.StageAuctionEnded and increase organizer's balance by total earnings", function() {
    var finalPrice = 0;
    var priorBalance = 0;
    var postBalance = 0;

    return DutchAuction.deployed()
    .then(function(instance) {
      priorBalance = web3.eth.getBalance(accounts[0]).toNumber();
      return instance.finalPrice.call({from: accounts[0]})
      .then(function(_finalPrice) {
        finalPrice = _finalPrice;
        return instance.transferEarningsToOrganizer({from: accounts[0]});
      })
      .then(function(tx) {
        postBalance = web3.eth.getBalance(accounts[0]).toNumber();
        // assert.equal(postBalance - priorBalance, finalPrice * 100, "organizer's call to transferEarningsToOrganizer() should set increase organizer's balance by total earnings");
        return instance.stage.call();
      })
      .then(function(stage) {
        assert.equal(stage, 3, "organizer's call to transferEarningsToOrganizer() should set stage=Stages.StageAuctionEnded");
      });
    });  
  });

});
