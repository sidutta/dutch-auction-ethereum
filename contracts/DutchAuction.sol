pragma solidity ^0.4.4;

contract DutchAuction {
  address public organizer;
  uint public itemsToAuction;
  mapping (address => uint) public itemsPurchased;
  mapping (address => uint) public amountTransferred;
  uint public totalItemsSold;
  uint public reservePrice;
  uint public startPrice;
  uint public priceDecreaseRate;
  uint public finalPrice;
  uint public startBlock;
  Stages public stage;

  event AuctionStarted();
  event BidReceived(address _from, uint quantity);
  event AuctionEnded(uint finalPrice);

  enum Stages {
    StageInitialized,
    StageAcceptingBids,
    StageBidFinished,
    StageAuctionEnded
  }

  modifier atStage(Stages _stage) {
    require(stage == _stage);
    _;
  }

  modifier isOrganizer() {
    require(msg.sender == organizer);
    _;
  }

  // Constructor
  function DutchAuction(uint _itemsToAuction, uint _reservePrice, uint _startPrice, uint _priceDecreaseRate) public { 
    organizer = msg.sender;     
    itemsToAuction = _itemsToAuction;
    totalItemsSold = 0;
    reservePrice = _reservePrice;
    startPrice = _startPrice;
    priceDecreaseRate = _priceDecreaseRate;
    stage = Stages.StageInitialized;
  }

  // Only organizer/ creator of the contract can allow bidding process to begin
  function allowBidding() public isOrganizer atStage(Stages.StageInitialized)
  {
    stage = Stages.StageAcceptingBids;
    startBlock = block.number;
    AuctionStarted();
  }

  // Get current price of the item(denoted by some decreasing function)
  function getCurrentItemPrice() public atStage(Stages.StageAcceptingBids) returns (uint)
  {
    return startPrice - priceDecreaseRate*(block.number - startBlock);
  }

  // Anyone can bid by sending the quantity and enough coins during bidding period
  function bid(uint quantity) public payable atStage(Stages.StageAcceptingBids) {
    uint currentPrice = getCurrentItemPrice();
    // throw if we have run out of items to sell
    require(itemsToAuction > totalItemsSold);
    // throw if not enough coins have been received for requested number of items
    require(currentPrice * (quantity + itemsPurchased[msg.sender]) <= amountTransferred[msg.sender] + msg.value); 

    // If all items couldn't be sold by bidding period, abort the auction and let everyone
    // withdraw back the coins they deposited 
    if(currentPrice<reservePrice) {
      finalPrice = 0;
      stage = Stages.StageAuctionEnded;
      AuctionEnded(0);
    }
    else {
      uint itemsToSell = quantity;
      // If items requested is greater than number of items remaning to sell,
      // decrease items requested to items remaning
      if(totalItemsSold + itemsToSell >= itemsToAuction) {
        itemsToSell = itemsToAuction - totalItemsSold;
        finalPrice = currentPrice;
        stage = Stages.StageBidFinished;
      }
      totalItemsSold = totalItemsSold + itemsToSell;
      itemsPurchased[msg.sender] = itemsPurchased[msg.sender] + itemsToSell;
      amountTransferred[msg.sender] = amountTransferred[msg.sender] + msg.value;
      BidReceived(msg.sender, quantity);
    }
  }

  // Bid organizer gets first chance to withdraw coins for items sold
  function transferEarningsToOrganizer() public isOrganizer atStage(Stages.StageBidFinished) returns (bool success) {
    uint earnings = totalItemsSold * finalPrice;
    if(earnings > 0) {
      if(organizer.send(earnings)) {
      	stage = Stages.StageAuctionEnded;
        AuctionEnded(finalPrice);
      	return true;
      }
      else throw;
    }
    return false;
  }

  // Bidders get to withdraw extra coins leftover due to their over-payments
  function withdrawExtraCoins() public atStage(Stages.StageAuctionEnded) returns (uint amountReturned) {
    uint totalAmountTransferred = amountTransferred[msg.sender];
    uint extra = totalAmountTransferred - finalPrice * itemsPurchased[msg.sender];
    if(extra > 0) {
      amountTransferred[msg.sender] = totalAmountTransferred - extra;
      if (!msg.sender.send(extra)) {
          amountTransferred[msg.sender] = totalAmountTransferred;
          return 0;
      }
      else {
      	return extra;
      }
    }
    return 0;
  }
}
