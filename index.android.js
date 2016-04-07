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
  volume: 0,
};

function reducer(state = initialState, action) {
  switch (action.type) {
  case 'NOW_PLAYING_RELOAD':
    return Object.assign({}, state, {nowPlayingTitle: "reloading..."});
  case 'NOW_PLAYING_FETCHED':
    return Object.assign({}, state, {nowPlayingTitle: action.data.name, nowPlayingUrl: action.url, volume: action.volume});
  case 'CHANGE_VOLUME':
    return Object.assign({}, state, {volume: (state.volume + action.diff)});
  default:
    return state;
  }
}

let store = createStore(reducer)

const mapStateToProps = (state) => {
  return {
    nowPlayingTitle: state.nowPlayingTitle,
    volume: state.volume,
  }
}

const getStreamMeta = (url, callback) => {
  var mediaRequest = new XMLHttpRequest();
  mediaRequest.open('GET', url);
  mediaRequest.send()
  setTimeout(function () {
    var meta = {
      name: mediaRequest.getResponseHeader("icy-name"),
    }
    callback(meta);
    mediaRequest.abort()
  }, 500);
}

const changeVolume = () => {
  fetch('http://172.20.0.35:8080/', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      volume: store.getState().volume,
      address: store.getState().nowPlayingUrl,
    })
  });
}

const mapDispatchToProps = (dispatch) => {
  return {
    reloadNowPlaying: () => {
      dispatch({type: "NOW_PLAYING_RELOAD"});

      fetch('http://172.20.0.35:8080/')
        .then((response) => response.json())
        .then((responseJson) => {
          getStreamMeta(responseJson.address, (meta) => {
            dispatch({type: "NOW_PLAYING_FETCHED", data: meta, url: responseJson.address, volume: responseJson.volume});
          });
        })
    },
    volumeUp: () => {
      dispatch({type: "CHANGE_VOLUME", diff: 10});
      changeVolume();
    },
    volumeDown: () => {
      dispatch({type: "CHANGE_VOLUME", diff: -10});
      changeVolume();
    },
  }
}

const toiletControlView = ({ nowPlayingTitle, volume, reloadNowPlaying, volumeUp, volumeDown }) => (
  <View>
    <Text style={{fontSize: 20}}>
      Now playing: {nowPlayingTitle}
    </Text>
    <Text style={{fontSize: 20}}>
      Volume: {volume}
    </Text>
    <Button text='REFRESH' raised={true} onPress={reloadNowPlaying}/>
    <Button text='VOL +' raised={true} onPress={volumeUp}/>
    <Button text='VOL -' raised={true} onPress={volumeDown}/>
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
