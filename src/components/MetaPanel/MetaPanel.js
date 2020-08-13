import React from "react";
import { Segment, Accordion, Header, Icon, Image, List } from "semantic-ui-react";

class MetaPanel extends React.Component {
  state = {
    channel: this.props.currentChannel,
    privateChannel: this.props.isPrivateChannel,
    activeIndex: 0
  };

  setActiveIndex = (event, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;
    this.setState({ activeIndex: newIndex });
  };

  // Object.entries will convert object to array
  // { a : "abc", b: "def"}
  // Object.entries will return
  // [["a", "abc"] , ["b", "def"]]
  displayTopPosters = posts => (
    Object.entries(posts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, val], i) => (
          <List.Item key={i}>
            <Image avatar src={val.avatar} />
            <List.Content>
              <List.Header as="a">{key}</List.Header>
              <List.Description>{val.count} {val.count == 1 ? 'post' : 'posts'}</List.Description>
            </List.Content>
          </List.Item>
        ))
        .slice(0, 4)
  )

  render() {
    const { activeIndex, privateChannel, channel } = this.state;
    const { userPosts } = this.props;
    if (privateChannel) return null;
// *************************

// when first this component loads we will not have deatils about the currentChannel in state
// thats why we check if channel info is there or not.
// If channel is loaded then we will have channel information
// if this check is not done. First time when this component loads, it will check for channel.name , but since 
// channel is not there, it will say cannot read property name of undefined.

// **************************
    return (
      <Segment loading={!channel}>
        <Header as="h3" attached="top">
          About # {channel && channel.name}
        </Header>
        <Accordion styled attached="true">
          <Accordion.Title
            active={activeIndex === 0}
            index={0}
            onClick={this.setActiveIndex}
          >
            <Icon name="dropdown" />
            <Icon name="info" />
            Channel Details
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 0}>
            {channel && channel.details}
          </Accordion.Content>

          <Accordion.Title
            active={activeIndex === 1}
            index={1}
            onClick={this.setActiveIndex}
          >
            <Icon name="dropdown" />
            <Icon name="user circle" />
            Top Posters
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 1}>
          <List>
            {userPosts && this.displayTopPosters(userPosts)}
          </List>
          </Accordion.Content>

          <Accordion.Title
            active={activeIndex === 2}
            index={2}
            onClick={this.setActiveIndex}
          >
            <Icon name="dropdown" />
            <Icon name="pencil alternate" />
            Created By
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 2}>
            <Header as="h3">
              <Image circular src={channel && channel.createdBy.avatar} />
              {channel && channel.createdBy.name}
            </Header>
          </Accordion.Content>
        </Accordion>
      </Segment>
    );
  }
}

export default MetaPanel;
