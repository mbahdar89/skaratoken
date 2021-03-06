pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
/**
 * @title Whitelist
 * @dev Handles a list inversors with investment boundaries to be used in a presale
 */
contract Whitelist is Ownable {

  mapping(address => uint256) dayOneWhitelist;
  mapping(address => uint256) dayTwoWhitelist;

  uint256 startWhitelisting;
  uint256 startDayTwo;
  uint256 cap; //absolute max investment boundary
  uint256 defaultBoundary; //absolute max investment boundary
 
  function Whitelist(uint256 _startWhitelisting, uint256 _cap, uint256 _defaultBoundary) public {
    startWhitelisting = _startWhitelisting;
    cap = _cap;
    startDayTwo = _startWhitelisting + 1 days;
    defaultBoundary = _defaultBoundary;
  }

  function addToDayOne(address investor) public onlyOwner {
    dayOneWhitelist[investor] = defaultBoundary;
  }

  function addToDayOneWithCustomBoundary(address investor, uint256 amount) public onlyOwner {
    dayOneWhitelist[investor] = amount;
  }

  function removeFromDayOne(address investor) public onlyOwner {
    delete dayOneWhitelist[investor];
  }

  function addToDayTwo(address investor) public onlyOwner {
    _addToDayTwo(investor);
  }

  function _addToDayTwo(address investor) internal {
    dayTwoWhitelist[investor] = cap;
  }

  function removeFromDayTwo(address investor)  public onlyOwner {
    delete dayTwoWhitelist[investor];
  }

  function isWhitelisted(address investor) public view returns (bool) {
    return dayOneWhitelist[investor] != 0 || dayTwoWhitelist[investor] != 0;
  }

  function isWhitelistedOnDayTwo(address investor) public view returns (bool) {
    return dayTwoWhitelist[investor] != 0;
  }


  /** 
  * the investment boundary predefined when  investor added to whitelis
  */
  function getBoundary(address investor) public view returns (uint256) {
    require(isWhitelistPeriod());
    require(isWhitelisted(investor));

    if(isDayOne()){
      return dayOneWhitelist[investor];
    }
 
    return cap;
  }

  /** 
  * the investment boundary is updated after every purchase 
  * in case the investor purchases again
  */
  function _updateBoundary(address investor, uint256 alreadyInvested) internal {
    require(isWhitelisted(investor));

    if(isDayOne()) {
      dayOneWhitelist[investor] = dayOneWhitelist[investor] - alreadyInvested;
    }
  }


  function isWhitelistPeriod() public view returns (bool) {
    return _inWindow(startWhitelisting, 2 days);
  }

  function isDayOne() public view returns (bool) {
    return _inWindow(startWhitelisting, 1 days);
  }

  function isDayTwo() public view returns (bool) {
   return _inWindow(startDayTwo, 1 days);
  }

  function _inWindow(uint256 _start, uint256 _duration) internal view returns(bool) {
    uint256 windowStart = _start;
    uint256 windowEnd = _start + _duration;
    return now >= windowStart && now < windowEnd; 
  }
}