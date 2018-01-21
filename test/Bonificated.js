import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMRevert from './helpers/EVMRevert'

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const SkaraCrowdsale = artifacts.require('SkaraCrowdsale');
const SkaraToken = artifacts.require('SkaraToken');

contract('Bonificated', function ([owner, investor, presaler]) {

    const RATE = new BigNumber(1000);
    const CAP  = ether(100);
    const PRESALE_CAP  = ether(60);
    
    before(async function() {
      //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
      await advanceBlock()
    })
  
    beforeEach(async function () {

      //crowdsale
      this.startTime = latestTime() + duration.weeks(1);
      var _duration =  duration.weeks(1);
      this.endTime =   this.startTime + _duration;
      this.afterEndTime = this.endTime + duration.seconds(1);
     
      this.whitelistStart = this.startTime + duration.minutes(1); // +1 minute so it starts after contract instantiation
      this.whitelistDayTwoStart = this.whitelistStart + duration.days(1);
      this.whitelistEnd = this.whitelistStart + duration.days(2);

      //bonus
      this.bonusStart = this.whitelistStart;
      this.openBonusStart = this.whitelistEnd; 
      this.bonusDuration = duration.days(3);
      this.afterBonusEnd = this.bonusStart + this.bonusDuration + duration.seconds(1);
    
      this.crowdsale = await SkaraCrowdsale.new(CAP,PRESALE_CAP, this.startTime,  this.endTime, RATE, owner, {from: owner});
      this.token = await SkaraToken.at(await this.crowdsale.token());

    });

    it('purchase on presale with custom bonus', async function () {
      const investment = ether(10);
      const customBonus = new BigNumber(41);
      const vestingDuration = duration.weeks(48);
      
      await this.crowdsale.setupPresaler(presaler, investment, vestingDuration, customBonus, {from:owner}).should.be.fulfilled;
      
      const tokensNoBonus = investment*RATE;
      
      const bonus = await this.crowdsale.getBonus(presaler, investment);
      bonus.should.be.bignumber.equal(customBonus);
      await this.crowdsale.buyTokens(presaler, {value: investment, from: presaler}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/100);

      const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);
      const balance = await this.token.balanceOf(vestingContractAddress);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    });

    it('purchase on presale with low bonus', async function () {
      const investment = ether(2.5);
      const expectedBonus = new BigNumber(30);
      
      const tokensNoBonus = investment*RATE;
      
      const bonus = await this.crowdsale.getBonus(presaler, investment);
      bonus.should.be.bignumber.equal(expectedBonus);

      await this.crowdsale.buyTokens(presaler, {value: investment, from: presaler}).should.be.fulfilled;
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/100);

      const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);
      const balance = await this.token.balanceOf(vestingContractAddress);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    });

    it('purchase on presale with medium bonus', async function () {
      const investment = ether(20);
      const expectedBonus = new BigNumber(35);
      const vestingDuration = duration.weeks(48);
      
      const tokensNoBonus = investment*RATE;
      
      const bonus = await this.crowdsale.getBonus(presaler, investment);
      bonus.should.be.bignumber.equal(expectedBonus);

      await this.crowdsale.buyTokens(presaler, {value: investment, from: presaler}).should.be.fulfilled;
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/100);

      const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);
      const balance = await this.token.balanceOf(vestingContractAddress);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    })

    it('purchase on presale with high bonus', async function () {
      const investment = ether(80);
      const expectedBonus = new BigNumber(45);
      const vestingDuration = duration.weeks(48);
      
      const tokensNoBonus = investment*RATE;
      
      const bonus = await this.crowdsale.getBonus(presaler, investment);
      bonus.should.be.bignumber.equal(expectedBonus);

      await this.crowdsale.buyTokens(presaler, {value: investment, from: presaler}).should.be.fulfilled;
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/100);

      const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);
      const balance = await this.token.balanceOf(vestingContractAddress);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    })

    it('purchase on whitelist bonus period: day one', async function () {
      
      const investment = ether(1);
      const expectedBonus = new BigNumber(15);
      await this.crowdsale.addToDayOne(investor, {from: owner}).should.be.fulfilled;
      
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistStart);
      
      const bonus = await this.crowdsale.getBonus(investor, investment);
      bonus.should.be.bignumber.equal(expectedBonus);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*expectedBonus/100);
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    });


    it('purchase on whitelist bonus period: day one + 12h', async function () {
      
      const investment = ether(1);
      const expectedBonus = new BigNumber(15);
      await this.crowdsale.addToDayOne(investor, {from: owner}).should.be.fulfilled;
      
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistStart + duration.hours(12));
      
      const bonus = await this.crowdsale.getBonus(investor, investment);
      bonus.should.be.bignumber.equal(expectedBonus);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*expectedBonus/100);
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    });
    it('reject non whitelisted purchase on whitelist bonus period: day one', async function () {
      
      const investment = ether(1);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistStart);
      
      const bonus = await this.crowdsale.getBonus(investor, investment);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('purchase on whitelist bonus period: day two', async function () {
      
      const investment = ether(1);
      const expectedBonus = new BigNumber(10);
      await this.crowdsale.addToDayTwo(investor, {from: owner}).should.be.fulfilled;

      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistDayTwoStart);
      
      const bonus = await this.crowdsale.getBonus(investor, investment);
      bonus.should.be.bignumber.equal(expectedBonus);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/100);
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    });

    it('purchase on whitelist bonus period: day two + 12h', async function () {
      
      const investment = ether(1);
      const expectedBonus = new BigNumber(10);
      await this.crowdsale.addToDayTwo(investor, {from: owner}).should.be.fulfilled;

      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistDayTwoStart + duration.hours(12));
      
      const bonus = await this.crowdsale.getBonus(investor, investment);
      bonus.should.be.bignumber.equal(expectedBonus);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/100);
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    });


    it('reject non whitelisted purchase on whitelist bonus period: day two', async function () {
      
      const investment = ether(1);
      const expectedBonus = new BigNumber(5);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistDayTwoStart);
      
      const bonus = await this.crowdsale.getBonus(investor, investment);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.rejectedWith(EVMRevert);
    });
    

    it('purchase on start open bonus period : day three', async function () {
      const investment = ether(1);
      const expectedBonus = new BigNumber(5);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.openBonusStart);
      
      const bonus = await this.crowdsale.getBonus(investor, investment);
      bonus.should.be.bignumber.equal(expectedBonus);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*expectedBonus/100);
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
    });

    it('purchase during open bonus period', async function () {
      const investment = ether(1);
      const expectedBonus = new BigNumber(5);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.openBonusStart + duration.hours(12));
      
      const bonus = await this.crowdsale.getBonus(investor, investment);
      bonus.should.be.bignumber.equal(expectedBonus);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*expectedBonus/100);
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
    });


    it('purchase after bonus period', async function () {
      const investment = ether(1);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.afterBonusEnd);
      const bonus = await this.crowdsale.getBonus(investor, investment);
      const tokensReceived = await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
     
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(tokensNoBonus);
    });
});



