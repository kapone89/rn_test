'use strict';
import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ListView
} from 'react-native';

import { combineReducers, createStore } from 'redux';
import { connect, Provider } from 'react-redux';
import { Button } from 'react-native-material-design';
import { fetch } from 'fetch';
import { DOMParser } from 'xmldom';
import { select } from 'xpath';

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
  case 'SEARCH_RESULTS_FETCHED':
    return Object.assign({}, state, {streamsSearchResults: action.results});
  default:
    return state;
  }
}

let store = createStore(reducer)

const mapStateToProps = (state) => {
  return {
    nowPlayingTitle: state.nowPlayingTitle,
    volume: state.volume,
    streamsSearchResults: state.streamsSearchResults,
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

const searchStations = (query, callback) => {
  console.log("search...");
  fetch('http://www.radiosure.com/rsdbms/search.php?status=active&search=jazz24&pos=0&reset_pos=0')
    .then((response) => response.text())
    .then((responseText) => {
      var doc = new DOMParser({errorHandler: {}}).parseFromString(responseText)
      var nodes = select("//a[contains(@href, 'details.php')]", doc)
      var results = nodes.map((n) => {
        return {
          name: n.textContent,
          url: ("http://www.radiosure.com/rsdbms/" + n.attributes[0].nodeValue)
        }
      })
      callback(results);
    })
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
    searchStations: () => {
      searchStations(null, (results) => {
        dispatch({type: "SEARCH_RESULTS_FETCHED", results: results});
        console.log(store.getState());
      });
    }
  }
}

const toiletControlView = ({ nowPlayingTitle, volume, reloadNowPlaying, volumeUp, volumeDown, searchStations, streamsSearchResults }) => (
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
    <Button text='search...' raised={true} onPress={searchStations}/>
    {streamsSearchResults.map((station) => {
      return <Text key={station.url} style={{fontSize: 20}}>{station.name}</Text>
    })}
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
