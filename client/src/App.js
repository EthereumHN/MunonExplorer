import React, { Component } from "react";
import HackathonMunonContract from "./contracts/HackathonMunon.json";
import getWeb3 from "./utils/getWeb3";

import "./App.css";

class App extends Component {
  state = { percentange_participants_getting_more_that_entry: 0,
            average_ether_collected: 0,
            average_rating: 0,
            top_participant_review_average: 0,
            participant_max_eth_collected: 0,
            gross_pot: 0,
            registration_count: 0,
            web3: null, accounts: null, contract: null }
  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      console.log(networkId);
      const deployedNetwork = HackathonMunonContract.networks[networkId];
      const instance = new web3.eth.Contract(
        HackathonMunonContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;

    var that = this;

    contract.getPastEvents('Registration', {
      fromBlock: 0,
      toBlock: 'latest'
    }, function(error, events){
      var i = 0;
      for (i=0; i<events.length; i++) {
        var eventObj = events[i];
      }
      
      contract.getPastEvents('SponsorshipSubmited', {
        fromBlock: 0,
        toBlock: 'latest'
      }, function(error, events){
        var i = 0;
        var sponsorship_count = 0;
        for (i=0; i<events.length; i++) {
          var eventObj = events[i];
          sponsorship_count += parseInt(eventObj.returnValues.value);
        }
        that.setState({ gross_pot: that.state.web3.utils.fromWei(""+(sponsorship_count + that.state.registration_count * 30000000000000000), 'ether') });
      });


    });

    contract.getPastEvents('CashOut', {
      fromBlock: 0,
      toBlock: 'latest'
    }, function(error, events){
      var participant_max_eth_collected = 0;
      var total_eth_collected = 0;
      var i = 0;
      var entrance_fee = 30000000000000000;
      var participants_collected_more_than_entry_count = 0;
      for (i=0; i<events.length; i++) {
        var eventObj = events[i];
        total_eth_collected += parseInt(events[i].returnValues.reward);
        if(participant_max_eth_collected < events[i].returnValues.reward)
        {
          participant_max_eth_collected = events[i].returnValues.reward;
        }
        if(events[i].returnValues.reward > entrance_fee)
        {
          participants_collected_more_than_entry_count += 1;
        }
      }

      var average_ether_collected = total_eth_collected/i;
      that.setState({ average_ether_collected: Math.round(that.state.web3.utils.fromWei(""+(average_ether_collected*10000), 'ether'))/10000 });
      that.setState({ participant_max_eth_collected: Math.round(that.state.web3.utils.fromWei(""+(participant_max_eth_collected*10000), 'ether'))/10000 });
      that.setState({ percentange_participants_getting_more_that_entry: Math.round(participants_collected_more_than_entry_count * 100 / i) });
    });

    contract.getPastEvents('RatingSubmited', {
      fromBlock: 0,
      toBlock: 'latest'
    }, function(error, events){
      var i = 0;
      var raiting_sum = 0;
      var points_by_participant = [];
      var participatn_addresses = [];
      for (i=0; i<events.length; i++) {
        raiting_sum += parseInt(events[i].returnValues.points);

        if(!points_by_participant[events[i].returnValues.reviewed_addr])
        {
          participatn_addresses.push(events[i].returnValues.reviewed_addr);
          points_by_participant[events[i].returnValues.reviewed_addr] = [parseInt(events[i].returnValues.points), 1];
        }
        else
        {
          points_by_participant[events[i].returnValues.reviewed_addr][0] += parseInt(events[i].returnValues.points);
          points_by_participant[events[i].returnValues.reviewed_addr][1] += 1;
        }
      }
      
      var top_review_score_average = 0;
      for(var j=0; j<participatn_addresses.length; j++)
      {
        var participant_points = points_by_participant[participatn_addresses[j]]
        var average = participant_points[0] / participant_points[1];
        if(top_review_score_average <  average)
          top_review_score_average = average;
      }
      
      var average_rating = raiting_sum / i;
      that.setState({ top_participant_review_average: Math.round(top_review_score_average*100)/100 });
      that.setState({ average_rating: Math.round(average_rating*100)/100 });
    });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Hackathon Muñon results</h1>
        <div>{ this.state.percentange_participants_getting_more_that_entry }% participants cashed out more Ether than the entrance fee</div>
        <div>Participants collected { this.state.average_ether_collected } average ether</div>
        <div>{ this.state.average_rating } / 5 average participant review score</div>
        <div>{ this.state.top_participant_review_average } / 5 top participant review score</div>
        <div>The top participant collected { this.state.participant_max_eth_collected } ether</div>
      </div>
    );
  }
}

export default App;