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

function counter(state = 0, action) {
  switch (action.type) {
  case 'INCREMENT':
    return state + 1;
  case 'DECREMENT':
    return state - 1;
  default:
    return state;
  }
}

let store = createStore(counter)

const mapStateToProps = (state) => {
  return {
    currentVal: state
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    incrementCallback: () => {
      dispatch({type: "INCREMENT"})
    },
    decrementCallback: () => {
      dispatch({type: "DECREMENT"})
    }
  }
}

const myNumberView = ({ incrementCallback, decrementCallback, currentVal }) => (
  <View>
    <Text style={{fontSize: 100}}>
      {currentVal}
    </Text>
    <Button text='Increment' raised={true} onPress={incrementCallback}/>
    <Button text='Decrement' raised={true} onPress={decrementCallback}/>
  </View>
)

const MyNumber = connect(
  mapStateToProps,
  mapDispatchToProps
)(myNumberView)

class MonteOffice extends Component {
  render() {
    return (
      <Provider store={store}>
        <View style={styles.container}>
          <MyNumber />
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
