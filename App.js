import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  AppState,
} from "react-native";
import * as Updates from "expo-updates";
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import axios from 'axios';

import { Api } from './src/Api';
import { store } from './src/redux/store';
import { setAuth, clearAuth } from './src/redux/slices/authSlice';
import RootNavigator from './src/navigation/rootNavigator';
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true)

  let appState = useRef(AppState.currentState);
  let backgroundTimeRef = useRef(0);
  let backgroundTimerRef = useRef(null);

  useEffect(() => {
    AppState.addEventListener("change", handleAppStateChange);

    return () => {
      AppState.removeEventListener("change", handleAppStateChange);
      clearTimeout(backgroundTimerRef.current);
    };
  }, []);
  const maxBackgroundDuration = 90000;
  const handleAppStateChange = (nextAppState) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      const backgroundTime = Date.now() - backgroundTimeRef.current;

      if (backgroundTime > maxBackgroundDuration) {
        resetAppState();
      } else {
        // Clear the background timer if the app is back within the acceptable duration
        clearTimeout(backgroundTimerRef.current);
      }
    } else if (
      appState.current === "active" &&
      nextAppState.match(/inactive|background/)
    ) {
      backgroundTimeRef.current = Date.now();
      backgroundTimerRef.current = setTimeout(() => {
        resetAppState();
      }, maxBackgroundDuration);
    }

    appState.current = nextAppState;
  };

  const resetAppState = async () => {
    console.log("reset app!");
    await Updates.reloadAsync();
    // Reset your app state and navigate to the initial screen or perform any required actions
  };

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'Rubik-italic': require('./assets/fonts/Rubik-Italic-VariableFont_wght.ttf'),
          'Rubik': require('./assets/fonts/Rubik-VariableFont_wght.ttf'),
          // Add more fonts as needed
        });

      } catch (e) {
        console.warn(e);
      } finally {
        /*  setLoading(false) */
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <RootNavigator onReady={onLayoutRootView} />
    </Provider>
  );
}