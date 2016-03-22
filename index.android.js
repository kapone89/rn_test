'use strict';
import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native';

import { combineReducers, createStore } from 'redux';
import { connect, Provider } from 'react-redux';
import { Button } from 'react-native-material-design';
import { fetch } from 'fetch';

let initialState = {
  nowPlayingUrl: null,
  nowPlayingTitle: "unknown",
  streamsSearchResults: [],
};

function reducer(state = initialState, action) {
  switch (action.type) {
  case 'NOW_PLAYING_RELOAD':
    return Object.assign({}, state, {nowPlayingTitle: "reloading..."});
  case 'NOW_PLAYING_FETCHED':
    return Object.assign({}, state, {nowPlayingTitle: action.data.name});
  default:
    return state;
  }
}

let store = createStore(reducer)

const mapStateToProps = (state) => {
  return {
    nowPlayingTitle: state.nowPlayingTitle
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    reloadNowPlaying: () => {
      dispatch({type: "NOW_PLAYING_RELOAD"});

      fetch('http://172.20.0.35:8080/')
        .then((response) => response.json())
        .then((responseJson) => {

          var mediaRequest = new XMLHttpRequest();
          mediaRequest.open('GET', responseJson.address);
          mediaRequest.send()
          setTimeout(function () {
            var actionData = {
              url: responseJson.address,
              name: mediaRequest.getResponseHeader("icy-name"),
            }
            dispatch({type: "NOW_PLAYING_FETCHED", data: actionData});
            mediaRequest.abort()
          }, 500);
        })
    }
  }
}

const toiletControlView = ({ nowPlayingTitle, reloadNowPlaying }) => (
  <View>
    <Text style={{fontSize: 20}}>
      Now playing: {nowPlayingTitle}
    </Text>
    <Button text='REFRESH' raised={true} onPress={reloadNowPlaying}/>
  </View>
)

const ToiletControl = connect(
  mapStateToProps,
  mapDispatchToProps
)(toiletControlView)

class MonteOffice extends Component {
  render() {
    return (
      <Provider store={store}>
        <View style={styles.container}>
          <ToiletControl />
        </View>
      </Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  }
});

AppRegistry.registerComponent('MonteOffice', () => MonteOffice);
