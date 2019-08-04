import React, { Component } from "react";
import HackathonMunonContract from "./contracts/HackathonMunon.json";
import getWeb3 from "./utils/getWeb3";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import {
  Heading, Text, Card, Icon
} from 'rimble-ui';

//import "./App.css";

class App extends Component {
  state = { percentange_participants_getting_more_that_entry: 0,
            average_ether_collected: 0,
            average_rating: 0,
            top_participant_review_average: 0,
            participant_max_eth_collected: 0,

            sps_percentange_participants_getting_more_that_entry: 0,
            sps_average_ether_collected: 0,
            sps_average_rating: 0,
            sps_top_participant_review_average: 0,
            sps_participant_max_eth_collected: 0,

            tgu_percentange_participants_getting_more_that_entry: 0,
            tgu_average_ether_collected: 0,
            tgu_average_rating: 0,
            tgu_top_participant_review_average: 0,
            tgu_participant_max_eth_collected: 0,

            registrations_chart_data: [{}],

            gross_pot: 0,
            registration_count: 0,
            event_count: 0,
            rating_count: 0,
            web3: null, accounts: null, contract: null }
  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
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
    const { contract } = this.state;

    var that = this;

    var registration_graph_data = [];
    var sps_registration_count = 0;
    var tgu_registration_count = 0;
    contract.getPastEvents('Registration', {
      fromBlock: 0,
      toBlock: 'latest'
    }, function(error, events){
      var i = 0;
      for (i=0; i<events.length; i++) {
        var eventObj = events[i];

        var chart_data_element = {};
        if(events[i].returnValues.hackathon_id === "1")
        {
          sps_registration_count += 1;
          chart_data_element = {blockNumber: parseInt(eventObj.blockNumber), registrations: i + 1, sps_registrations: sps_registration_count};
        }
        if(events[i].returnValues.hackathon_id === "2")
        {
          tgu_registration_count += 1;
          chart_data_element = {blockNumber: parseInt(eventObj.blockNumber), registrations: i + 1, tgu_registrations: tgu_registration_count};
        }
        registration_graph_data.push(chart_data_element);
      }
      
      that.setState({ registration_count: i });

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
      
      that.state.registrations_chart_data = registration_graph_data;
    });

    contract.getPastEvents('CashOut', {
      fromBlock: 0,
      toBlock: 'latest'
    }, function(error, events){
      var participant_max_eth_collected = 0;
      var sps_participant_max_eth_collected = 0;
      var tgu_participant_max_eth_collected = 0;
      var total_eth_collected = 0;
      var sps_total_eth_collected = 0;
      var tgu_total_eth_collected = 0;
      var i = 0;
      var entrance_fee = 30000000000000000;
      var participants_collected_more_than_entry_count = 0;
      var sps_participants_collected_more_than_entry_count = 0;
      var sps_total_cashout = 0;
      var tgu_participants_collected_more_than_entry_count = 0;
      var tgu_total_cashout = 0;
      for (i=0; i<events.length; i++) {
        var eventObj = events[i];
        total_eth_collected += parseInt(eventObj.returnValues.reward);
        if(participant_max_eth_collected < eventObj.returnValues.reward)
        {
          participant_max_eth_collected = eventObj.returnValues.reward;
        }
        if(eventObj.returnValues.reward > entrance_fee)
        {
          participants_collected_more_than_entry_count += 1;
          if(eventObj.returnValues.hackathon_id === "1")
            sps_participants_collected_more_than_entry_count += 1;
          if(eventObj.returnValues.hackathon_id === "2")
            tgu_participants_collected_more_than_entry_count += 1;
        }
        if(eventObj.returnValues.hackathon_id === "1")
        {
          sps_total_cashout += 1;
          sps_total_eth_collected += parseInt(eventObj.returnValues.reward);
          if(sps_participant_max_eth_collected < eventObj.returnValues.reward)
          {
            sps_participant_max_eth_collected = eventObj.returnValues.reward;
          }
        }
        if(eventObj.returnValues.hackathon_id === "2")
        {
          tgu_total_cashout += 1;
          tgu_total_eth_collected += parseInt(eventObj.returnValues.reward);
          if(tgu_participant_max_eth_collected < eventObj.returnValues.reward)
          {
            tgu_participant_max_eth_collected = eventObj.returnValues.reward;
          }
        }
      }

      var average_ether_collected = total_eth_collected/i;
      var sps_average_ether_collected = sps_total_eth_collected / sps_total_cashout;
      var tgu_average_ether_collected = tgu_total_eth_collected / tgu_total_cashout;
      that.setState({ average_ether_collected: Math.round(that.state.web3.utils.fromWei(""+(average_ether_collected*10000), 'ether'))/10000 });
      that.setState({ sps_average_ether_collected: Math.round(that.state.web3.utils.fromWei(""+(sps_average_ether_collected*10000), 'ether'))/10000 });
      that.setState({ tgu_average_ether_collected: Math.round(that.state.web3.utils.fromWei(""+(tgu_average_ether_collected*10000), 'ether'))/10000 });
      that.setState({ participant_max_eth_collected: Math.round(that.state.web3.utils.fromWei(""+(participant_max_eth_collected*10000), 'ether'))/10000 });
      that.setState({ sps_participant_max_eth_collected: Math.round(that.state.web3.utils.fromWei(""+(sps_participant_max_eth_collected*10000), 'ether'))/10000 });
      that.setState({ tgu_participant_max_eth_collected: Math.round(that.state.web3.utils.fromWei(""+(tgu_participant_max_eth_collected*10000), 'ether'))/10000 });
      that.setState({ percentange_participants_getting_more_that_entry: Math.round(participants_collected_more_than_entry_count * 100 / i) });
      that.setState({ sps_percentange_participants_getting_more_that_entry: Math.round(sps_participants_collected_more_than_entry_count * 100 / sps_total_cashout) });
      that.setState({ tgu_percentange_participants_getting_more_that_entry: Math.round(tgu_participants_collected_more_than_entry_count * 100 / tgu_total_cashout) });
    });

    contract.getPastEvents('RatingSubmited', {
      fromBlock: 0,
      toBlock: 'latest'
    }, function(error, events){
      var i = 0;
      var raiting_sum = 0;
      var sps_raiting_sum = 0;
      var tgu_raiting_sum = 0;
      var sps_rating_count = 0;
      var tgu_rating_count = 0;
      var points_by_participant = [];
      var sps_points_by_participant = [];
      var tgu_points_by_participant = [];
      var participant_addresses = [];
      var sps_participant_addresses = [];
      var tgu_participant_addresses = [];
      for (i=0; i<events.length; i++) {
        raiting_sum += parseInt(events[i].returnValues.points);

        if(!points_by_participant[events[i].returnValues.reviewed_addr])
        {
          participant_addresses.push(events[i].returnValues.reviewed_addr);
          points_by_participant[events[i].returnValues.reviewed_addr] = [parseInt(events[i].returnValues.points), 1];
        }
        else
        {
          points_by_participant[events[i].returnValues.reviewed_addr][0] += parseInt(events[i].returnValues.points);
          points_by_participant[events[i].returnValues.reviewed_addr][1] += 1;
        }

        if(events[i].returnValues.hackathon_id === "1")
        {
          sps_raiting_sum += parseInt(events[i].returnValues.points);
          sps_rating_count += 1;
        }
        if(events[i].returnValues.hackathon_id === "2")
        {
          tgu_raiting_sum += parseInt(events[i].returnValues.points);
          tgu_rating_count += 1;
        }

        if(events[i].returnValues.hackathon_id === "1")
        {
          if(!sps_points_by_participant[events[i].returnValues.reviewed_addr])
          {
            sps_participant_addresses.push(events[i].returnValues.reviewed_addr);
            sps_points_by_participant[events[i].returnValues.reviewed_addr] = [parseInt(events[i].returnValues.points), 1];
          }
          else
          {
            sps_points_by_participant[events[i].returnValues.reviewed_addr][0] += parseInt(events[i].returnValues.points);
            sps_points_by_participant[events[i].returnValues.reviewed_addr][1] += 1;
          }
        }
        if(events[i].returnValues.hackathon_id === "2")
        {
          if(!tgu_points_by_participant[events[i].returnValues.reviewed_addr])
          {
            tgu_participant_addresses.push(events[i].returnValues.reviewed_addr);
            tgu_points_by_participant[events[i].returnValues.reviewed_addr] = [parseInt(events[i].returnValues.points), 1];
          }
          else
          {
            tgu_points_by_participant[events[i].returnValues.reviewed_addr][0] += parseInt(events[i].returnValues.points);
            tgu_points_by_participant[events[i].returnValues.reviewed_addr][1] += 1;
          }
        }
      }
      
      var top_review_score_average = 0;
      var j;
      for(j=0; j<participant_addresses.length; j++)
      {
        var participant_points = points_by_participant[participant_addresses[j]]
        var average = participant_points[0] / participant_points[1];
        if(top_review_score_average <  average)
          top_review_score_average = average;
      }

      var sps_top_review_score_average = 0;
      for(j=0; j<sps_participant_addresses.length; j++)
      {
        var sps_participant_points = sps_points_by_participant[sps_participant_addresses[j]]
        var sps_average = sps_participant_points[0] / sps_participant_points[1];
        if(sps_top_review_score_average <  sps_average)
          sps_top_review_score_average = sps_average;
      }

      var tgu_top_review_score_average = 0;
      for(j=0; j<tgu_participant_addresses.length; j++)
      {
        var tgu_participant_points = tgu_points_by_participant[tgu_participant_addresses[j]]
        var tgu_average = tgu_participant_points[0] / tgu_participant_points[1];
        if(tgu_top_review_score_average <  tgu_average)
          tgu_top_review_score_average = tgu_average;
      }
      
      var average_rating = raiting_sum / i;
      var sps_average_rating = sps_raiting_sum / sps_rating_count;
      var tgu_average_rating = tgu_raiting_sum / tgu_rating_count;
      that.setState({ top_participant_review_average: Math.round(top_review_score_average*100)/100 });
      that.setState({ sps_top_participant_review_average: Math.round(sps_top_review_score_average*100)/100 });
      that.setState({ tgu_top_participant_review_average: Math.round(tgu_top_review_score_average*100)/100 });
      that.setState({ average_rating: Math.round(average_rating*100)/100 });
      that.setState({ sps_average_rating: Math.round(sps_average_rating*100)/100 });
      that.setState({ tgu_average_rating: Math.round(tgu_average_rating*100)/100 });
      that.setState({ rating_count: i });
    });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <Card>
          <Heading.h1>El Hackathon Muñón results</Heading.h1>
          <Text>In July 2019, <a href="http://munonhack.com">El Hackathón Muñón</a> powered <b>2 events</b> one in San Pedro Sula other in Tegucigalpa, Honduras. <b>{ this.state.rating_count } transparent feedback</b> was given by <b>{ this.state.registration_count } participants</b> and <b>a pot of { this.state.gross_pot } ether</b> was distributed.</Text>
          <Card>
            <Heading>Total results</Heading>
            <Icon name="Mood" size="30"/>
            <Text>{ this.state.percentange_participants_getting_more_that_entry }% participants cashed out more Ether than the entrance fee</Text>
            <Icon name="AccountBalanceWallet" size="30"/>
            <Text>Participants collected { this.state.average_ether_collected } average ether</Text>
            <Icon name="Assignment" size="30"/>
            <Text>{ this.state.average_rating } / 5 average participant review score</Text>
            <Icon name="Star" size="30"/>
            <Text>{ this.state.top_participant_review_average } / 5 top participant review score</Text>
            <Icon name="Whatshot" size="30"/>
            <Text>The top participant collected { this.state.participant_max_eth_collected } ether</Text>
          </Card>
          
          <Card>
            <Heading>San Pedro Sula results</Heading>
            <Icon name="Mood" size="30"/>
            <Text>{ this.state.sps_percentange_participants_getting_more_that_entry }% participants cashed out more Ether than the entrance fee</Text>
            <Icon name="AccountBalanceWallet" size="30"/>
            <Text>Participants collected { this.state.sps_average_ether_collected } average ether</Text>
            <Icon name="Assignment" size="30"/>
            <Text>{ this.state.sps_average_rating } / 5 average participant review score</Text>
            <Icon name="Star" size="30"/>
            <Text>{ this.state.sps_top_participant_review_average } / 5 top participant review score</Text>
            <Icon name="Whatshot" size="30"/>
            <Text>The top participant collected { this.state.sps_participant_max_eth_collected } ether</Text>
          </Card>
          <Card>
            <Heading>Tegucigalpa results</Heading>
            <Icon name="Mood" size="30"/>
            <Text>{ this.state.tgu_percentange_participants_getting_more_that_entry }% participants cashed out more Ether than the entrance fee</Text>
            <Icon name="AccountBalanceWallet" size="30"/>
            <Text>Participants collected { this.state.tgu_average_ether_collected } average ether</Text>
            <Icon name="Assignment" size="30"/>
            <Text>{ this.state.tgu_average_rating } / 5 average participant review score</Text>
            <Icon name="Star" size="30"/>
            <Text>{ this.state.tgu_top_participant_review_average } / 5 top participant review score</Text>
            <Icon name="Whatshot" size="30"/>
            <Text>The top participant collected { this.state.tgu_participant_max_eth_collected } ether</Text>
          </Card>
          <Card>
            <Heading>Registration timeline</Heading>
            <LineChart width={400} height={400} data={ this.state.registrations_chart_data }>
              <XAxis type="number" dataKey="blockNumber" domain={[this.state.registrations_chart_data[0].blockNumber, this.state.registrations_chart_data[this.state.registrations_chart_data.length-1].blockNumber]} />
              <YAxis/>
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="registrations" stroke="#6E1EFF" />
              <Line connectNulls type="monotone" dataKey="sps_registrations" stroke="#0EDA83" />
              <Line connectNulls type="monotone" dataKey="tgu_registrations" stroke="#F1AF1B" />
            </LineChart>
          </Card>
        </Card>
      </div>
    );
  }
}

export default App;