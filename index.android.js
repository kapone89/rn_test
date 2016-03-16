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
    onClick: () => {
      dispatch({type: "INCREMENT"})
    }
  }
}

const myNumberView = ({ onClick, currentVal }) => (
  <TouchableOpacity onPress={onClick}>
    <Text style={{fontSize: 100}}>
      {currentVal}
    </Text>
  </TouchableOpacity>
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
