import React from 'react';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

const styles = {margin:12}

class FormInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      address:null,
      name:null,
      accounts:[],
      attendees:[],
      participants:[],
      detail:{}
    };
  }

  componentDidMount(){
    this.props.eventEmitter.on('accounts_received', accounts => {
      this.setState({
        address:accounts[0],
        accounts:accounts
      })
    });

    this.props.eventEmitter.on('participants_updated', participants => {
      this.setState({
        participants:participants
      })
    });

    this.props.eventEmitter.on('detail', detail => {
      this.setState({detail:detail});
    })

    this.props.eventEmitter.on('attendees', attendees => {
      this.setState({
        attendees:attendees
      })
    });
  }

  handleAction(actionName) {
    var args = [];
    switch (actionName) {
      case 'attend':
        args.push(this.state.attendees);
        break;
      case 'attendWithConfirmation':
        args.push(this.state.confirmation_code);
        break;
      case 'register':
        args.push(this.state.name);
        break;
      case 'registerWithInvitation':
        args.push(this.state.name);
        args.push(this.state.invitation_code);
        break;
    }
    this.props.action(actionName, this.state.address.trim(), args)
    this.setState({
      name: null,
      attendees:[]
    });
    this.props.eventEmitter.emit('attendees', []);
  }

  handleSelect(event,index,value){
    this.setState({
      address: value,
    });
  }

  participantStatus(){
    var p = this.selectParticipant(this.state.participants, this.state.address);
    if (p) {
      if (p.attended == false) {
        return 'registered';
      }else if(p.attended && p.payout == 0 && !p.paid){
        return 'attended';
      }else if (p.attended && p.payout >= 0 && !p.paid){
        return 'won';
      }else if (p.paid){
        return 'withdrawn';
      }else{
        console.log('unrecognised', p)
        return('unrecognised state');
      }
    }else{
      return 'not registered';
    }
  }

  selectParticipant(participants, address){
    return participants.filter(function(p){
       return p.address == address
    })[0]
  }

  isOwner(){
    return this.state.accounts.includes(this.state.detail.owner);
  }

  showRegister(){
    return this.state.detail.canRegister && this.participantStatus() == 'not registered';
  }

  showAttend(){
    return this.state.detail.canAttend
  }

  showWithdraw(){
    return this.state.detail.canWithdraw && this.participantStatus() == 'won';
  }

  showAttendForAttendant(){
    return this.state.detail.confirmation && this.state.detail.canAttend && this.participantStatus() == 'registered';
  }

  showPayback(){
    return this.state.detail.canPayback
  }

  showCancel(){
    return this.state.detail.canCancel
  }

  showClear(){
    return this.state.detail.ended
  }

  handleName(e) {
    this.setState({
      name: e.target.value,
    });
  }

  handleInvitationCode(e) {
    this.setState({
      invitation_code: e.target.value
    });
  }

  handleConfirmationCode(e) {
    this.setState({
      confirmation_code: e.target.value
    });
  }

  render() {
    let adminButtons, registerButton, warningText;
    if(this.isOwner()){
      adminButtons = <div>

        <RaisedButton secondary={this.showAttend()} disabled={!this.showAttend()}
          label="Batch Attend" style={styles}
          onClick={this.handleAction.bind(this, 'attend')}
        />
        <RaisedButton secondary={this.showPayback()} disabled={!this.showPayback()}
          label="Payback" style={styles}
          onClick={this.handleAction.bind(this, 'payback')}
        />
        <RaisedButton secondary={this.showCancel()} disabled={!this.showCancel()}
          label="Cancel" style={styles}
          onClick={this.handleAction.bind(this, 'cancel')}
        />
        <RaisedButton secondary={this.showClear()} disabled={!this.showClear()}
          label="Clear" style={styles}
          onClick={this.handleAction.bind(this, 'clear')}
        />
      </div>
    }

    var availableSpots = this.state.detail.limitOfParticipants - this.state.detail.registered;
    if(this.props.read_only){
      registerButton = <span>Connect via Mist/Metamask to be able to register.</span>
    }else if(this.state.accounts.length > 0){
      if(this.state.detail.ended){
        registerButton = <span>This event is over </span>
      }else if (availableSpots <= 0){
        registerButton = <span>No more spots left</span>
      }else{
        if (this.state.detail.invitation) {
          var invitationField =  <TextField
                      floatingLabelText="invitation code"
                      floatingLabelFixed={true}
                      value={this.state.invitation_code}
                      onChange={this.handleInvitationCode.bind(this)}
                      style={{margin:'0 5px'}}
          />
          var action = 'registerWithInvitation';
        }else{
          var action = 'register';
        }
        registerButton = <RaisedButton secondary={this.showRegister()} disabled={!this.showRegister()}
          label="Register" style={styles}
          onClick={this.handleAction.bind(this, action)}
        />
        warningText = <div style={{textAlign:'center', color:'red'}}>Please be aware that you <strong>cannot</strong> cancel once regiesterd. Please read FAQ section at ABOUT page on top right corner for more detail about this service.</div>
      }
    }else{
      registerButton = <span>No account is set</span>
    }

    if (this.state.detail.confirmation) {
      if (this.showAttendForAttendant()) {
        var confirmationField =  <TextField
                    floatingLabelText="confirmation code"
                    floatingLabelFixed={true}
                    value={this.state.confirmation_code}
                    onChange={this.handleConfirmationCode.bind(this)}
                    style={{margin:'0 5px'}}
        />
      }
      var action = 'attendWithConfirmation';
      var attendWithConfirmationButton = <RaisedButton secondary={this.showAttendForAttendant()} disabled={!this.showAttendForAttendant()}
        label="Attend" style={styles}
        onClick={this.handleAction.bind(this, action)}
      />
    }

    var withdrawButton = <RaisedButton secondary={this.showWithdraw()} disabled={!this.showWithdraw()}
      label="Withdraw" style={styles}
      onClick={this.handleAction.bind(this, 'withdraw')}
    />

    if (this.showRegister()) {
      var nameField = <TextField
        hintText="@twitter_handle"
        floatingLabelText="Twitter handle"
        floatingLabelFixed={true}
        value={this.state.name}
        onChange={this.handleName.bind(this)}
        style={{margin:'0 5px'}}
      />
    }

    return (
      <Paper zDepth={1}>
        <form>
          {confirmationField}
          {invitationField}
          {nameField}
          <SelectField
            value={this.state.address}
            onChange={this.handleSelect.bind(this)}
            floatingLabelText="Account address"
            floatingLabelFixed={true}
            style={{width:'25em', verticalAlign:'top', margin:'0 5px'}}
            >
            {
              this.state.accounts.map(account => {
                return (<MenuItem value={account} primaryText={account} />)
              })
            }
          </SelectField>
          {registerButton}
          {attendWithConfirmationButton}
          {withdrawButton}
          {adminButtons}
        </form>
        {warningText}
      </Paper>
    );
  }
}

export default FormInput;
