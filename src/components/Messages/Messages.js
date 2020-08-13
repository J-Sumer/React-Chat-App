import React from 'react'
import { Segment, Comment} from 'semantic-ui-react'
import firebase from '../../firebase'
import MessageHeader from './MessageHeader'
import MessageForm from './MessageForm'
import Message from './Message'
import { connect } from 'react-redux'
import { setUserPosts } from '../../actions'

class Messages extends React.Component {
    state = {
        messagesRef: firebase.database().ref('messages'),
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        messages: [],
        messagesLoading: true,
        uniqueUsers: 0,
        searchTerm: '',
        searchLoading: false,
        searchResults: [],
        privateChannel: this.props.isPrivateChannel,
        privateMessagesRef: firebase.database().ref('privateMessges'),
        isChannelStarred: false,
        usersRef: firebase.database().ref('users')
    }

    componentDidMount() {
        const { channel, user } = this.state

        if(channel && user ) {
            this.addListeners(channel.id)
            this.addUserStarsLitener(channel.id, user.uid)
        }
    }

    addListeners = channelId => {
        this.addMessageListener(channelId)
    }

    addMessageListener = channelId => {
        let loadedMessages = [];
        const ref = this.getMessageRef();
        ref.child(channelId).on('child_added', snap => {
            loadedMessages.push(snap.val())
            this.setState({
                messages: loadedMessages,
                messagesLoading: false
            })
            this.countUniqueUsers(loadedMessages)
            this.countUserPosts(loadedMessages)
        })
    }

    addUserStarsLitener = (channelId, userId) => {
        this.state.usersRef
           .child(userId)
           .child('starred')
           .once('value')
           .then( data => {
               if(data.val !== null ) {
                   const channelIds = Object.keys(data.val())
                   const prevStarred = channelIds.includes(channelId)
                   this.setState({ isChannelStarred: prevStarred })
               }
           })
    }

    getMessageRef = () => {
        const { messagesRef, privateMessagesRef, privateChannel } = this.state
        return privateChannel ? privateMessagesRef : messagesRef;
    }

    handleSearchChange = event => {
        this.setState({
            searchTerm: event.target.value,
            searchLoading: true
        }, () => this.handleSearchMessages())
    }

    handleStar = () => {
        this.setState( prevState => ({
            isChannelStarred: !prevState.isChannelStarred
        }), () => this.starChannel())
    }

    starChannel = () => {
        if(this.state.isChannelStarred) {
            this.state.usersRef
               .child(`${this.state.user.uid}/starred`)
               .update({
                   [this.state.channel.id]: {
                       name: this.state.channel.name,
                       details: this.state.channel.details,
                       createdBy: {
                           name: this.state.channel.createdBy.name,
                           avatar: this.state.channel.createdBy.avatar
                       }
                   }
               })
        } else {
            this.state.usersRef
               .child(`${this.state.user.uid}/starred`)
               .child(this.state.channel.id)
               .remove( err => {
                   if(err !== null) {
                       console.log(err)
                   }
               })
        }
    }

    handleSearchMessages = () => {
        const channelMessages = [...this.state.messages]
        const regex = new RegExp(this.state.searchTerm, 'gi')
        const searchResults = channelMessages.reduce((acc, message) => {
            if(message.content && message.content.match(regex) || message.user.name.match(regex) ) {
                acc.push(message)
            }
            return acc
        }, [])
        this.setState({ searchResults })
        setTimeout(() => this.setState({ searchLoading: false }), 100)
    }

    countUniqueUsers = (messages) => {
        const uniqueUsers = messages.reduce((acc, mess) => {
            if(!acc.includes(mess.user.name)) {
                acc.push(mess.user.name)
            }
            return acc
        }, [])
        this.setState({ uniqueUsers: uniqueUsers.length})
    }

    countUserPosts = messages => {
        let userPosts = messages.reduce((acc, message) => {
            if(message.user.name in acc) {
                acc[message.user.name].count += 1
            } else {
                acc[message.user.name] = {
                    avatar: message.user.avatar,
                    count: 1
                }
            }
            return acc
        }, {})
        this.props.setUserPosts(userPosts)
    }

    displayMessages = messages => (
        messages.length > 0 && messages.map(message => (
            <Message 
              key={message.timestamp}
              message={message}
              user={this.state.user}
               />
        ))
    )

    displayChannelName = (channel) => {
        return channel ? `${this.state.privateChannel ? '@' : '#'} ${channel.name}` : '';
    }

    render () {
        const {messagesRef, channel, user, messages, uniqueUsers, searchResults, searchTerm, searchLoading, privateChannel, isChannelStarred } = this.state
        return (
            <React.Fragment>
                <MessageHeader channelName = {this.displayChannelName(channel)} uniqueUsers={uniqueUsers} searchLoading={searchLoading} handleSearchChange={this.handleSearchChange} isPrivateChannel={privateChannel} handleStar ={this.handleStar} isChannelStarred={isChannelStarred} />

                <Segment className="messages_base">
                    <Comment.Group className="messages">
                        { searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
                    </Comment.Group>
                </Segment>

                <MessageForm getMessageRef={this.getMessageRef() } currentChannel={channel} messagesRef={messagesRef} currentUser={user} isPrivateChannel={privateChannel} />
            </React.Fragment>
        )
    }
}

export default connect(null, {setUserPosts})(Messages)