import React from 'react';
import { View, Text, Dimensions, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ListItem, SearchBar, Button } from 'react-native-elements';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import firebase from 'react-native-firebase'
import { updateFriends, addFriend, removeFriend, getFriends } from '../../actions/User';
import AddFriend from './AddFriend';
import ViewFriend from './ViewFriend';
import { Cancel } from '../navButtons';
import styles from '../styles/main';

let deviceWidth = Dimensions.get('window').width;

class Friends extends React.Component {

    state = {
        friends: [],
        filter: false,
        showAddFriendModal: false,
        showViewFriendModal: false,
        selectedFriend: null
    }
    setModalVisible = (visible, type) => {
        switch(type) {
            case 'Add Friend' :
                this.setState({
                    showAddFriendModal: visible
                })
                break;
            case 'View Friend' :
                this.setState({
                    showViewFriendModal: visible
                })
        }
    }
    filterFriends = (input) => {
        if(this.props.friends) {
            const friends = this.props.friends.filter(f => {
                return f.displayName.includes(input);
            })
            this.setState({
                friends,
                filter: true
            })
        }
    }
    handleViewFriend = (friend) => {
        this.setModalVisible(true, 'View Friend');
        this.setState({
            selectedFriend: friend
        })
    }
    render() {
        let friendList;
        if(this.props.friends) { 
            let friends = this.state.filter ? this.state.friends : this.props.friends;
            friendList =
                friends.map((friend) => (
                    <ListItem
                        containerStyle={{width: 300}}
                        onPress={() => this.handleViewFriend(friend)}
                        leftAvatar={{rounded:true, source:{uri:friend.photoURL} }}
                        key={friend.uid}
                        title={friend.displayName}
                        subtitle={friend.email}
                        bottomDivider
                    />
                ))
            } 
            return (
                <View style={styles.centeredContainer}>
                    {/* ADD FRIEND */}
                    <View style={{width:deviceWidth,flexDirection:'row',justifyContent:'space-between'}}>
                        <Text style={styles.header}>Friends</Text>
                        <Button
                            onPress={() => this.setModalVisible(true, 'Add Friend')}
                            icon={{name:'md-person-add',type:'ionicon',size:16,color:'#3578E5'}}
                            title='Add Friend'
                            titleStyle={{color:'#3578E5',fontSize:14,fontWeight:'500',marginLeft:-5}}
                            buttonStyle={{backgroundColor:'transparent'}}
                        />
                    </View>
                {/* FRIENDS */}
                    <SearchBar
                        lightTheme
                        containerStyle={{width: 300,marginBottom: 10, backgroundColor: 'transparent', borderBottomColor: 'transparent', borderTopColor: 'transparent'}}
                        inputStyle={{color: '#222'}}
                        onChangeText={(e) => this.filterFriends(e)}
                        placeholder='Filter by Name...'
                    />
                        <ScrollView>
                            {friendList}
                        </ScrollView>
                    <Modal
                        animationType="slide"
                        transparent={false}
                        visible={this.state.showAddFriendModal}>
                        <View style={[styles.centeredContainer]}>
                            <AddFriend onAddFriend={(uid,fid) => {
                                this.setModalVisible(false, 'Add Friend');
                                this.props.dispatch(addFriend(uid,fid));
                            }}/>
                            <Cancel onCancel={() => this.setModalVisible(false, 'Add Friend')} />
                        </View>
                    </Modal>
                    {/* VIEW FRIEND */}
                    <Modal
                        animationType="slide"
                        transparent={false}
                        visible={this.state.showViewFriendModal}>
                        <View style={[styles.centeredContainer,{marginTop:50}]}>
                            {/* show users timeline activity
                                and options to remove friend or send message (rev2)*/}
                            <ViewFriend 
                                currentUser={this.props.currentUser}
                                friend={this.state.selectedFriend}
                                onRemoveFriend={(uid,fid) => {
                                    this.setModalVisible(false, 'View Friend');
                                    this.props.dispatch(removeFriend(uid,fid))
                                }} 
                            />
                        <Cancel onCancel={() => this.setModalVisible(false, 'View Friend')} />
                        </View>
                    </Modal>
                </View>
            )
       // } else {
       //     return null
        //}
    }
}

const mapStateToProps = (state, props) => ({
    currentUser: state.currentUser,
    friends: state.friends
})
export default connect(mapStateToProps)(Friends);