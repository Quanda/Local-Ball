import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, AlertIOS, Dimensions, RefreshControl, Modal } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { ListItem, Card, Button, Avatar } from 'react-native-elements';
import firebase from 'react-native-firebase';
import { sortByDateDesc } from '../../../assets/helper';
import BallIcon from '../../../assets/img/nyk.png';
import Timeline from 'react-native-timeline-listview';
import { connect } from 'react-redux';
import { Cancel } from '../navButtons';
import styles from '../styles/main';
import EventModal from '../EventModal';
import { MAPBOX_ACCESS_TOKEN } from '../../../config';
import Mapbox from '@mapbox/react-native-mapbox-gl';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

let deviceHeight = Dimensions.get('window').height;

class ViewFriend extends React.Component {
    constructor() {
        super();
        this.unsubscribeUserEvents = null;
        this.state = {
            refreshing: false,
            modalVisible: false,
            selectedEvent: null,
            events: null
        }
    }
    componentDidMount() {
        // Fetch events for User
        this.fetchUserEvents();
    }
    componentWillUnmount() {
        this.unsubscribeUserEvents();
    }
    // changes visibility of modal
    setModalVisible = (visible, item) => {
        this.setState({ 
            modalVisible: visible,
            selectedEvent: item
        });
    }
    onRefresh = () => {
        this.setState({refreshing: true});
        this.fetchUserEvents();
        this.setState({refreshing: false});        
    }
    fetchUserEvents = () => {
        this.unsubscribeUserEvents = firebase.firestore().collection('events').where("participants", "array_contains", this.props.friend.uid) 
        .onSnapshot(eventsSnapshot => {
            let events = [];
            let counter = 0;
            eventsSnapshot.forEach(doc => {
                const { type, date, event_author, comment, court } = doc.data();
                let event = {
                    doc, 
                    id: doc.id,
                    type,
                    court: court,
                    event_author,
                    participants: [],
                    date: date.toLocaleDateString('en-US',{year:'2-digit',month:'2-digit',day:'2-digit'}),
                    comment,
                } 
                firebase.firestore().doc(`events/${event.id}`)
                .get()
                .then(doc => {
                    let participants = doc.data().participants;
                    participants.forEach(uid => {
                        // get user info and add as participant to event
                        firebase.firestore().doc(`users/${uid}`)
                        .get()
                        .then(doc => {
                            let participant = doc.data();
                            event['participants'].push(participant);
                        })                            
                    })
                    events.push(event);
                    counter++;
                    return counter;
                })
                .then((counter) => {
                    // if all events have been retrieved, update state 
                    if(counter === eventsSnapshot.size) {
                        this.setState({events})
                    }
                })
            })
        }, error => {
            console.log('snapshot error!')
            console.log(error);
        })
    }
    confirmRemove = (friend) => {
        AlertIOS.alert(
            'Please Confirm',
            `Are you sure you want to unfollow ${friend.displayName}?`,
            [
              {
                text: 'Cancel',
              },
              {
                text: 'OK',
                onPress: () => this.props.onRemoveFriend(this.props.currentUser.uid,friend.uid)
              },
            ]
          );
    }    
    render() {
        let modal, eventsView;

        if(this.state.events) {

            // determine how events will be rendered  
            let eventsData = this.state.events.map((event,i) => {
                return {
                    time: event.date,
                    title: event.type,
                    description: `${event.comment}`,
                    icon: BallIcon,
                    event_author: event.event_author,
                    participants: event.participants,
                    comment: event.comment,
                    court: event.court,
                    id: event.id,
                    key:i.toString()
                }
            });

            // sort timeline data by date descending
            eventsData.sort(sortByDateDesc)

            eventsView = 
            <Timeline
                data={eventsData}
                columnFormat='single-column-left'
                innerCircle='icon'
                titleStyle={{color: '#333'}}
                descriptionStyle={{color:'#333'}}
                circleColor='rgba(0,0,0,0)'
                lineColor='#3578E5'
                rowContainerStyle={{minWidth: 250}}
                timeContainerStyle={{minWidth: 72}}
                timeStyle={{textAlign: 'center', backgroundColor:'transparent', color:'#333', padding:5, borderRadius:13}}
                onEventPress={event => this.setModalVisible(true,event)}
            />

            if(this.state.modalVisible) {
                modal = 
                    <EventModal
                      setModalVisible={this.setModalVisible}
                      event={this.state.selectedEvent}
                    />
            }
        }
        return ( 
            <View style={[styles.centeredContainer,{marginTop:25}]}>
                <Avatar
                    size='large'
                    rounded
                    source={{uri: this.props.friend.photoURL}}
                    activeOpacity={0.7}
                />
                <Text style={styles.text}>{this.props.friend.displayName}</Text> 
                <TouchableOpacity style={{marginTop:10}}>
                    <Text style={styles.smallRed} onPress={() => this.confirmRemove(this.props.friend)}>Remove Friend</Text>
                </TouchableOpacity>                 
                <ScrollView contentContainerStyle={{height:deviceHeight*.4,marginTop:30}}
                    refreshControl={
                        <RefreshControl 
                            refreshing={this.state.refreshing}
                            onRefresh={this.onRefresh}
                        />
                    }
                >
                    {modal}
                    {eventsView}
                </ScrollView>
            </View>
        )
    }
}

export default ViewFriend;