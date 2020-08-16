import React from 'react'
import { Segment, Comment} from 'semantic-ui-react'
import firebase from '../../firebase'
import MessageHeader from './MessageHeader'
import MessageForm from './MessageForm'
import Message from './Message'
import { connect } from 'react-redux'
import { setUserPosts } from '../../actions'
import Typing from './Typing'

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
        usersRef: firebase.database().ref('users'),
        typingRef: firebase.database().ref('typing'),
        typingUsers: [],
        connectedRef: firebase.database().ref('.info/connected'),
        listeners: []
    }

    componentDidMount() {
        const { channel, user, listeners } = this.state

        if(channel && user ) {
            this.removeListeners(listeners)
            this.addListeners(channel.id)
            this.addUserStarsLitener(channel.id, user.uid)
        }
        if(this.messagesEnd) {
            this.messagesEnd.scrollIntoView()
        }
    }

    componentDidUpdate = () => {
        if(this.messagesEnd) {
            this.scrollToBottom()
        }
    }

    componentWillUnmount() {
        this.removeListeners(this.state.listeners)
        this.state.connectedRef.off()
    }

    removeListeners = listeners => {
        listeners.forEach( listener => {
            listener.ref.child(listener.id).off(listener.event)
        })
    }

    addToListeners = (id, ref, event) => {
        const index = this.state.listeners.findIndex( listener => {
            return listener.id === id && listener.ref === ref && listener.event === event
        })

        if(index === -1) {
            const newListener = { id, ref,event}
            this.setState({ listeners: this.state.listeners.concat(newListener)})
        }
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: 'smooth'})
    }

    addListeners = channelId => {
        this.addMessageListener(channelId)
        this.addTypingListeners(channelId)
    }

    addTypingListeners = channelId => {
        let typingUsers = []
        this.state.typingRef.child(channelId).on('child_added', snap => {
            if(snap.key !== this.state.user.uid) {
                typingUsers = typingUsers.concat({
                    id: snap.key,
                    name: snap.val()
                })
                this.setState({ typingUsers})
            }
        })
        this.addToListeners(channelId, this.state.typingRef, 'child_added')

        this.state.typingRef.child(channelId).on('child_removed', snap => {
            const index = typingUsers.findIndex( user => user.id === snap.key );
            if( index !== -1 ) {
                typingUsers = typingUsers.filter( user => user.id !== snap.key )
                this.setState({ typingUsers })
            }
        })

        this.addToListeners(channelId, this.state.typingRef, 'child_removed')

        this.state.connectedRef.on('value', snap => {
            if(snap.val() === true) {
                this.state.typingRef
                  .child(channelId)
                  .child(this.state.user.uid)
                  .onDisconnect()
                  .remove()
            }
        })
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
        this.addToListeners(channelId, ref, 'child_added')
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

    displayTypingUsers = users => (
        users.length > 0 && users.map( user => (
            <div key={user.id} style={{ display: "flex" , alignItems: "center", marginBottom: '0.2em'}}>
                <span className="user__typing">{user.name} is</span> <Typing/> 
            </div>
        ))
    )

    render () {
        const {messagesRef, channel, user, messages, uniqueUsers, searchResults, searchTerm, searchLoading, privateChannel, isChannelStarred, typingUsers } = this.state
        return (
            <React.Fragment>
                <MessageHeader channelName = {this.displayChannelName(channel)} uniqueUsers={uniqueUsers} searchLoading={searchLoading} handleSearchChange={this.handleSearchChange} isPrivateChannel={privateChannel} handleStar ={this.handleStar} isChannelStarred={isChannelStarred} />

                <Segment className="messages_base">
                    <Comment.Group className="messages">
                        { searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
                        {this.displayTypingUsers(typingUsers)}
                    </Comment.Group>
                    <div ref={node => (this.messagesEnd = node)}/>
                </Segment>

                <MessageForm getMessageRef={this.getMessageRef() } currentChannel={channel} messagesRef={messagesRef} currentUser={user} isPrivateChannel={privateChannel} />
            </React.Fragment>
        )
    }
}

export default connect(null, {setUserPosts})(Messages)