import React from 'react'
import {Grid, Form, Segment, Button, Header, Message, Icon} from 'semantic-ui-react'
import {Link } from 'react-router-dom'
import firebase from '../../firebase'

class Login extends React.Component {
    state = {
        email: '',
        password: '',
        errors: [],
        loading: false,
    }
    handleChange =(e) => {
        this.setState({[e.target.name]: e.target.value})
    }


    handleSubmit = (e) => {
        e.preventDefault()
        if(this.isFormValid(this.state)) {
            this.setState({errors: [], loading: true})
            firebase
              .auth()
              .signInWithEmailAndPassword(this.state.email, this.state.password)
              .then(signedInUser => {
                  
              })
              .catch(err => {
                  console.error(err);
                  this.setState({
                      errors: this.state.errors.concat(err),
                      loading: false
                  })
              })
        }        
    }

    isFormValid = ({email, password}) => {
        return email && password
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
        const { errors, email, password , loading} = this.state
        return (
            <Grid textAlign="center" verticalAlign="middle" className="app">
                <Grid.Column style={{ maxWidth: 450 }}>
                    <Header as="h2" icon color="violet" textAlign="center">
                        <Icon name="code branch" color="violet"/>
                        Login to DevChat
                    </Header>
                    {errors.length> 0 && (
                        <Message error>
                            {this.displayErrors(errors)}
                        </Message>
                    )}
                    <Form onSubmit={this.handleSubmit} size="large">
                        <Segment stacked>
                            <Form.Input className={this.handleInputError(errors, "email")} fluid name="email" icon="mail" iconPosition="left" placeholder="Email" onChange={this.handleChange} type="email" value={email}/>
                            <Form.Input className={this.handleInputError(errors, "password")} fluid name="password" icon="lock" iconPosition="left" placeholder="Password" onChange={this.handleChange} type="password" value={password}/>
                            <Button disabled={loading} className={loading ? 'loading' : ''} color="violet" fluid size="large">Submit</Button>
                        </Segment>
                    </Form>
                    <Message>Donthave an accoutn? <Link to="/register">Register</Link></Message>
                </Grid.Column>
            </Grid>
        )
    }
}

export default Login