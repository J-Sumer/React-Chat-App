import React from 'react'
import {Header, Segment, Input, Icon} from 'semantic-ui-react'


class MessageHeader extends React.Component {
    render () {
        const { channelName, uniqueUsers, handleSearchChange, searchLoading, isPrivateChannel, handleStar, isChannelStarred } = this.props;
        const usrTxt = uniqueUsers == 1 ? 'User' : 'Users'
        return (
            <Segment clearing>
                <Header fluid="true" as="h2" floated="left" style={{ marginBottom: 0}} >
                    <span>
                    {channelName} {" "}
                    { !isPrivateChannel && <Icon onClick={handleStar} name={isChannelStarred ? 'star' : 'star outline'} color={isChannelStarred ? 'orange' : 'black'}/>}
                    </span>
                    <Header.Subheader> {uniqueUsers} {usrTxt} </Header.Subheader>
                </Header>

                <Header floated="right">
                    <Input loading={searchLoading} onChange={handleSearchChange} size="mini" icon="search" name="searchTerm" placeholder="Search Messaages"/>
                </Header>
            </Segment>
        )
    }
}

export default MessageHeader