'use strict';
import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ListView,
  TextInput,
  ScrollView,
} from 'react-native';

import { combineReducers, createStore } from 'redux';
import { connect, Provider } from 'react-redux';
import { Button, Toolbar } from 'react-native-material-design';
import { fetch } from 'fetch';
import { DOMParser } from 'xmldom';
import { select } from 'xpath';
import { stringify } from 'query-string';

let initialState = {
  nowPlayingUrl: null,
  nowPlayingTitle: "unknown",
  stationsSearchResults: [],
  streamsSearchResults: [],
  stationSearchQuery: "",
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
  case 'STATIONS_FETCHED':
    return Object.assign({}, state, {stationsSearchResults: action.results});
  case 'STREAMS_FETCHED':
    return Object.assign({}, state, {streamsSearchResults: action.results});
  case 'UPDATE_STATION_QUERY':
    return Object.assign({}, state, {stationSearchQuery: action.query});
  default:
    return state;
  }
}

let store = createStore(reducer)

const mapStateToProps = (state) => {
  return {
    nowPlayingTitle: state.nowPlayingTitle,
    nowPlayingUrl: state.nowPlayingUrl,
    volume: state.volume,
    stationsSearchResults: state.stationsSearchResults,
    streamsSearchResults: state.streamsSearchResults,
    stationSearchQuery: state.stationSearchQuery,
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

const searchStations = (callback) => {
  let params = {
    status: "active",
    search: store.getState().stationSearchQuery,
    pos: 0,
    reset_pos: 0,
  }
  fetch('http://www.radiosure.com/rsdbms/search.php?' + stringify(params))
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

const searchStreams = (stationDetailsUrl, callback) => {
  fetch(stationDetailsUrl)
  .then((response) => response.text())
  .then((responseText) => {
    var doc = new DOMParser({errorHandler: {}}).parseFromString(responseText)
    var nodes = select("//tr[contains(.//td, 'Source ')]//a", doc)
    var results = nodes.map((n, id) => {
      return {url: n.textContent, id: id};
    })
    callback(results);
  })
}

const selectStream = (streamUrl) => {
  fetch('http://172.20.0.35:8080/', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      volume: store.getState().volume,
      address: streamUrl,
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
    searchStations: () => {
      searchStations((results) => {
        dispatch({type: "STATIONS_FETCHED", results: results});
      });
    },
    searchStreams: (stationDetailsUrl) => {
      searchStreams(stationDetailsUrl, (results) => {
        dispatch({type: "STREAMS_FETCHED", results: results});
      });
    },
    selectStream: (streamUrl) => {
      selectStream(streamUrl);
    },
    updateStationQuery: (newQuery) => {
      dispatch({type: "UPDATE_STATION_QUERY", query: newQuery});
    },
  }
}

const toiletControlView = ({ nowPlayingTitle, nowPlayingUrl, volume, reloadNowPlaying, volumeUp, volumeDown,
  searchStations, stationsSearchResults, searchStreams, streamsSearchResults, selectStream,
  stationSearchQuery, updateStationQuery }) => (
  <ScrollView>
    <Toolbar title="ToiletDJ" icon="menu" actions={[{icon: "refresh", onPress: reloadNowPlaying}]}/>
    <View style={{marginTop: 60}}>
      <Text style={{fontSize: 20}}>
        Now playing: {nowPlayingTitle}
      </Text>
      <Text style={{fontSize: 20}}>
        URL: {nowPlayingUrl}
      </Text>
      <Text style={{fontSize: 20}}>
        Volume: {volume}
      </Text>
      <Button text='VOL +' raised={true} onPress={volumeUp}/>
      <Button text='VOL -' raised={true} onPress={volumeDown}/>
      <TextInput onChangeText={(text) => { updateStationQuery(text) }}/>
      <Button text='search...' raised={true} onPress={searchStations}/>
      <Text style={{fontSize: 20}}>
        Stations:
      </Text>
      {stationsSearchResults.map((station) => {
        return <Button text={station.name} key={station.url} raised={true} onPress={() => {searchStreams(station.url)}}/>
      })}
      <Text style={{fontSize: 20}}>
        Streams:
      </Text>
      {streamsSearchResults.map((stream) => {
        return <Button text={stream.url} key={stream.id} raised={true} onPress={() => {selectStream(stream.url)}}/>
      })}
    </View>
  </ScrollView>
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
