import React from 'react';
import ReactDOM from 'react-dom';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import Paper from 'material-ui/Paper';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import Avatar from 'material-ui/Avatar';
import RaisedButton from 'material-ui/RaisedButton';
import Checkbox from 'material-ui/Checkbox';
import math from 'mathjs';

const getTwitterIcon = (name) =>(
  <Avatar style={{verticalAlign:'middle'}} src={`https://avatars.io/twitter/${name}`} size={26} />
)

const styles = {
  paperRight:{
    flex: 3,
    textAlign: 'center',
  }
};

class Participants extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accounts:[],
      address: null,
      participants:[],
      attendees:[],
      detail:{},
      etherscan_url:null
    };
  }

  componentDidMount(){
    // Initialize
    this.props.getParticipants(participants =>{
      this.setState({participants});
    });

    this.props.eventEmitter.on('change', _ => {
      console.log('CHANGE', _);
      this.props.getParticipants(participants =>{
        this.setState({participants});
      });
    });
    this.props.eventEmitter.on('accounts_received', accounts => {
      this.setState({
        address:accounts[0],
        accounts:accounts
      })
    });
    this.props.eventEmitter.on('detail', detail => {
      this.setState({detail:detail});
    })

    this.props.eventEmitter.on('network', network => {
      this.setState({
        etherscan_url: network.etherscan_url
      });
    })
    this.props.eventEmitter.on('attendees', attendees => {
      // Resets after clicking 'attend' button.
      if(attendees.length != this.state.attendees.length){
        this.setState({
          attendees:[]
        })
      }
    });
  }

  isOwner(){
    return this.state.accounts.includes(this.state.detail.owner);
  }

  isUser(participant){
    return this.state.accounts.includes(participant.address);
  }

  toNumber(value){
    if(value) return value.toNumber();
  }

  handleAttendees(participantAddress, event, isInputChecked){
    // console.log('isInputChecked', isInputChecked);
    if (isInputChecked) {
      this.state.attendees.push(participantAddress)
    }else{
      this.state.attendees = this.state.attendees.filter(function(a){
        return a != participantAddress;
      })
    }
    this.props.eventEmitter.emit('attendees', this.state.attendees);
    return true;
  }

  yesNo(participant){
    if(participant.attended) {
      return 'Yes';
    }else{
      if(this.isOwner() && !this.state.detail.ended){
        return (
          <Checkbox
            onCheck={this.handleAttendees.bind(this, participant.address)}
          />
        )
      }else{
        return '';
      }
    }
  }

  displayBalance(participant){
    var amount = web3.fromWei(this.toNumber(participant.payout))
    let color = 'black';
    let message = '';
    if (amount > 0){
      color = 'green';
      if(participant.paid){
        message = 'Earned';
      }else{
        message = 'Won';
      }
    }
    if (amount < 0){
      color = 'red' ;
      message = 'Lost';
    }
    return(
      <span style={{color:color}}>
        { math.round(amount, 3).toString() } {message}
      </span>
    )
  }

  displayParticipants(){
    if(!this.state.detail.name) return(
      <TableRowColumn width={100} >
        <p>
          <h5>No info available.</h5>
          The reason are more likely to be one of the followings.
          <ul>
            <li>
              You are not connected to the correct Ethereum network (testnet) with correct options.
            </li>
            <li>
              Your local node is out of sync (may take a few hours if this is your first time using Ethereum).
            </li>
          </ul>
          Please follow the instructions at 'About' page to solve.
        </p>
      </TableRowColumn>
    )
    if(this.state.participants.length > 0){
      return this.state.participants.map((participant) => {
        var participantAddress;
        if (this.state.etherscan_url) {
          participantAddress = (
            (<a target='_blank' href={ `${this.state.etherscan_url}/address/${participant.address}` }>{participant.address.slice(0,5)}...</a>)
          )
        }else{
          participantAddress = (
            `${participant.address.slice(0,5)}...`
          )
        }
        return (
          <TableRow>
            <TableRowColumn width={50}>
              {getTwitterIcon(participant.name)}
              <span style={{paddingLeft:'1em'}}><a target='_blank' href={ `https://twitter.com/${participant.name}` }>{participant.name}</a> </span>
                ({participantAddress})
              </TableRowColumn>
            <TableRowColumn width={10} >{this.yesNo(participant)}</TableRowColumn>
            <TableRowColumn width={20} >
              <span>
                { this.displayBalance(participant) }
              </span>
            </TableRowColumn>
          </TableRow>
        )
      })
    }else{
      return(<TableRowColumn style={{textAlign:'center'}} width={100} >No one has registered yet. Be the first to register by typing your twitter handle and press 'Register'</TableRowColumn>)
    }
  }

  render() {
    return (
      <Paper zDepth={1} style={styles.paperRight}>
          <h4>Participants</h4>
          <Table>
            <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
              <TableRow>
                <TableHeaderColumn width={50} >Name</TableHeaderColumn>
                <TableHeaderColumn width={10} >Attended</TableHeaderColumn>
                <TableHeaderColumn width={20} >Payout</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody displayRowCheckbox={false}>
              {this.displayParticipants()}
            </TableBody>
          </Table>
      </Paper>
    );
  }
}
export default Participants;
