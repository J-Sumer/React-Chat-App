import React from "react";
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase'
import FileModal from './FileModal'

import { Segment, Button, Input } from 'semantic-ui-react'
import ProgressBar from "./ProgressBar";

class MessageForm extends React.Component {
    state = {
        message: '',
        loading: false,
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        errors: [],
        modal: false,
        uploadState: '',
        uploadTask: null,
        storageRef: firebase.storage().ref(),
        percentUploaded: 0,
        privateChannel: this.props.isPrivateChannel
    }

    openModal = () => this.setState({ modal: true })
    closeModal = () => this.setState({ modal: false })

    handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value, errors: []})
    }

    createMessage =( fileUrl = null) => {
        const message = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            user: {
                id: this.state.user.uid,
                name: this.state.user.displayName,
                avatar: this.state.user.photoURL
            },            

        }
        if(fileUrl !== null) {
            message['image'] = fileUrl
        } else {
            message['content'] = this.state.message
        }
        return message
    }

    sendMessage = () => {
        const { getMessageRef } = this.props
        const { message, channel, modal } = this.state

        if(message) {
            this.setState({ loading: true })
            getMessageRef
              .child(channel.id)
              .push()
              .set(this.createMessage())
              .then(() => {
                  this.setState({ loading: false, message: '', errors: [] })
              })
              .catch( err => {
                  console.error(err)
                  this.setState({ loading: false, errors: this.state.errors.concat(err)})
              })

        } else {
            this.setState({
                errors : this.state.errors.concat({ message: 'Add a message'})
            })
        }
    }

    getPath = () => {
      if(this.props.isPrivateChannel) {
        return `chat/private-${this.state.channel.id}`
      } else {
        return `chat/public`
      }
    }

    uploadFile = (file, metadata) => {
        const pathToUpload = this.state.channel.id;
        const ref = this.props.getMessageRef;
        const filePath = `${this.getPath()}/${uuidv4()}.jpg`;
    
        this.setState(
          {
            uploadState: "uploading",
            uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
          },
          () => {
            this.state.uploadTask.on(
              "state_changed",
              snap => {
                const percentUploaded = Math.round(
                  (snap.bytesTransferred / snap.totalBytes) * 100
                );
                this.setState({ percentUploaded });
              },
              err => {
                console.error(err);
                this.setState({
                  errors: this.state.errors.concat(err),
                  uploadState: "error",
                  uploadTask: null
                });
              },
              () => {
                this.state.uploadTask.snapshot.ref
                  .getDownloadURL()
                  .then(downloadUrl => {
                    this.sendFileMessage(downloadUrl, ref, pathToUpload);
                  })
                  .catch(err => {
                    console.error(err);
                    this.setState({
                      errors: this.state.errors.concat(err),
                      uploadState: "error",
                      uploadTask: null
                    });
                  });
              }
            );
          }
        );
      };

    sendFileMessage = (fileUrl, ref, pathToUpload) => {
        ref.child(pathToUpload)
        .push()
        .set(this.createMessage(fileUrl))
        .then(() => {
            this.setState ({ uploadState: 'done'})
        })
        .catch(err => {
            console.error(err);
            this.setState({
                errors : this.state.errors.concat(err)
            })
        })
    }

    render () {
        const { errors, message, loading, modal, uploadState, percentUploaded } = this.state
        return (
            <Segment className="message__form">
                <Input onChange={this.handleChange} fluid name="message" style={{ marginBottom: '0.7em' }} 
                    label={<Button icon={'add'} /> } labelPosition='left' placeholder='write your message'
                    className={
                        errors.some(err => err.message.includes('message')) ? 'error' : ''
                    } value={message} disabled={loading} />
                <Button.Group icon widths='2'>
                    <Button onClick={this.sendMessage} color='orange' content="Add reply" labelPosition="left" icon="edit"/>
                    <Button onClick={this.openModal} disabled={uploadState === 'uploading'} color='teal' content="Upload Media" labelPosition="right" icon="cloud upload"/>
                </Button.Group>
                <FileModal modal={modal} closeModal={this.closeModal} uploadFile={this.uploadFile} />
                <ProgressBar uploadState={uploadState} percentUploaded={percentUploaded}  />
            </Segment>
        )
    }
}

export default MessageForm