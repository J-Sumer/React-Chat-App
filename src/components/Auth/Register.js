import React from 'react'
import {Grid, Form, Segment, Button, Header, Message, Icon} from 'semantic-ui-react'
import {Link } from 'react-router-dom'
import firebase from '../../firebase'
import md5 from 'md5'

class Register extends React.Component {
    state = {
        username: '',
        email: '',
        password: '',
        passwordConformation: '',
        errors: [],
        loading: false,
        usersRef: firebase.database().ref('users')
    }
    handleChange =(e) => {
        this.setState({[e.target.name]: e.target.value})
    }

    isFormValid = () => {
        let errors = []
        let error
        if(this.isFormEmpty(this.state)){
            error = {message: 'Fill in all fields'}
            this.setState({errors : errors.concat(error)})
            return false
        } else if (!this.isPasswordValid(this.state)) {
            error = {message: 'Password is invalid'}
            this.setState({errors: errors.concat(error)})
            return false
        } 
        return true
    }

    isFormEmpty = ({ username, email, password, passwordConformation}) => {
        return !username.length || !email.length || !password.length || !passwordConformation.length
    }

    isPasswordValid = ({ password, passwordConformation }) => {
        if(password.length < 6 || passwordConformation.length < 6) {
            return false
        } else if (password !== passwordConformation) {
            return false
        }
        return true
    }

    handleSubmit = (e) => {
        e.preventDefault()
        if(this.isFormValid()) {
            this.setState({errors: [], loading: true})
            firebase
                .auth()
                .createUserWithEmailAndPassword(this.state.email, this.state.password)
                .then(createdUser => {
                    createdUser.user.updateProfile({
                        displayName: this.state.username,
                        photoURL: `http://gravatar.com/avatar/${md5(createdUser.user.email)}?d=identicon`
                    })
                    .then(() =>{
                        this.saveUser(createdUser).then(() => {
                            console.log('user saved')
                        })
                        this.setState({ loading: false})
                    })
                    .catch(err => {
                        console.log(err)
                        this.setState({ errors: this.state.errors.concat(err), loading: false })
                    })
                })
                .catch(err => {
                    console.log(err)
                    this.setState({errors: this.state.errors.concat(err), loading: false})
                })
        }        
    }

    saveUser = (createdUser) => {
        return this.state.usersRef.child(createdUser.user.uid).set({
            name: createdUser.user.displayName,
            avatar: createdUser.user.photoURL
        })
    }

    displayErrors = (errors) => (
        errors.map((e, i) => {
            return <p key={i}>{e.message}</p>
        })
    )

    handleInputError = (errors, input) => {
        // **** 'return' is important in both cases
        return errors.some( err => {
            return err.message.toLowerCase().includes(input)
        }) ? 'error' : ''
    }
     
    render() { 
        const { username, email, password, passwordConformation, errors, loading } = this.state 
        return (
            <Grid textAlign="center" verticalAlign="middle" className="app">
                <Grid.Column style={{ maxWidth: 450 }}>
                    <Header as="h2" icon color="orange" textAlign="center">
                        <Icon name="puzzle" color="orange"/>
                        Register for DevChat
                    </Header>
                    {errors.length> 0 && (
                        <Message error>
                            {this.displayErrors(errors)}
                        </Message>
                    )}
                    <Form onSubmit={this.handleSubmit} size="large">
                        <Segment stacked>
                            <Form.Input className={this.handleInputError(errors, "username")} fluid name="username" icon="user" iconPosition="left" placeholder="Username" onChange={this.handleChange} type="text" value={username} />
                            <Form.Input className={this.handleInputError(errors, "email")} fluid name="email" icon="mail" iconPosition="left" placeholder="Email" onChange={this.handleChange} type="email" value={email}/>
                            <Form.Input className={this.handleInputError(errors, "password")} fluid name="password" icon="lock" iconPosition="left" placeholder="Password" onChange={this.handleChange} type="password" value={password}/>
                            <Form.Input className={this.handleInputError(errors, "password")} fluid name="passwordConformation" icon="repeat" iconPosition="left" placeholder="Confirm Password" onChange={this.handleChange} type="password" value={passwordConformation}/>
                            <Button disabled={loading} className={loading ? 'loading' : ''} color="orange" fluid size="large">Submit</Button>
                        </Segment>
                    </Form>
                    <Message>Already a user? <Link to="/login">Login</Link></Message>
                </Grid.Column>
            </Grid>
        )
    }
}

export default Register