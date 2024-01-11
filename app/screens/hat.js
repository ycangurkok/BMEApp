import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { View, Image, StyleSheet, Button, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import base64 from 'react-native-base64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

function StreamScreen() {
  const [streamData, setStreamData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const navigation = useNavigation();
  const wsRef = useRef(null); // Use useRef for the WebSocket instance

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#000', // Set the header background color
      },
      headerTintColor: '#fff', 
    });
  }, [navigation]);
  
  const startStream = async () => {
    try {
      // Send a GET request to the start-stream endpoint
      await fetch('http://172.21.207.145:5001/start-stream', { method: 'GET' });
      console.log('Stream start request sent');
    } catch (error) {
      Speech.speak("Failed to start stream", {language: "en-US"});
      console.error('Error sending start stream request:', error);
    }
  };
  
  const stopStream = async () => {
    try {
      // Send a GET request to the stop-stream endpoint
      await fetch('http://172.21.207.145:5001/stop-stream', { method: 'GET' });
      console.log('Stream stop request sent');
    } catch (error) {
      Speech.speak("Failed to stop stream", {language: "en-US"});
      console.error('Error sending stop stream request:', error);
    }
  };
  
  const connectWebSocket = async () => {
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      wsRef.current = new WebSocket('ws://172.21.207.145:5001/ws/client');

      wsRef.current.onopen = async () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        await startStream();
      };

      wsRef.current.onmessage = (e) => {
        let bytes = new Uint8Array(e.data);
        let binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
        let imageBase64 = base64.encode(binary);
        let imageSrc = `data:image/jpeg;base64,${imageBase64}`;
        setStreamData(imageSrc);
      };

      wsRef.current.onerror = (e) => {
        console.log(e.message);
      };

      wsRef.current.onclose = async () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
        await stopStream();
      };
    }
  };

  useEffect(() => {
    connectWebSocket(); // This will be called each time the component mounts
  
    return () => {
      if (wsRef.current) {
        wsRef.current.close(); // Close WebSocket on unmount
      }
    };
  }, []);
  
  const handleButtonPress1 = async () => {
    console.log('Button 1 pressed');
  
    if (!streamData) {
      console.error('No stream data available');
      return;
    }
  
    try {
      // Create FormData and append the image
      const formData = new FormData();
      // Send the FormData using fetch to your desired endpoint
      formData.append('ImageFile', {
        uri: streamData,
        type: 'image/jpg',
        name: 'photo.jpg'
      });
      const response = await fetch('https://bemyeyesdeploy.azurewebsites.net/api/ImageAnalysis/describeImage', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });
  
      if (!response.ok) {
        console.log(response);
        throw new Error('Failed to send image');
      }
  
      console.log('Image sent successfully');
      let responseData = await response.json();
      console.log(responseData);
      lastSpoken = String(responseData);
      await AsyncStorage.setItem('lastSpoken', lastSpoken);
      const speak = () => {
          const options = {
            language: "en-US",
            onDone: () => console.log("Speech done"),
            onStart: () => console.log("Speech started"),
          };
        
          Speech.speak(lastSpoken, options);
        };
        
      speak();     
    } catch (error) {
      Speech.speak("Failed to send image", {language: "en-US"});
      console.error('Error sending image:', error);
    }
  };

  const handleButtonPress2 = async () => {
    console.log('Button 2 pressed');
  
    if (!streamData) {
      console.error('No stream data available');
      return;
    }
  
    try {
      // Create FormData and append the image
      const formData = new FormData();
      // Send the FormData using fetch to your desired endpoint
      formData.append('ImageFile', {
        uri: streamData,
        type: 'image/jpg',
        name: 'photo.jpg'
      });
      const response = await fetch('https://bemyeyesdeploy.azurewebsites.net/api/ImageAnalysis/wordsImage', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });
  
      if (!response.ok) {
        console.log(response);
        throw new Error('Failed to send image');
      }
  
      console.log('Image sent successfully');
      let responseData = await response.json();
      const keys = Object.keys(responseData);
      responseData = keys
      lastSpoken = String(responseData);
      await AsyncStorage.setItem('lastSpoken', lastSpoken);
      const speak = () => {
          const options = {
            language: "en-US",
            onDone: () => console.log("Speech done"),
            onStart: () => console.log("Speech started"),
          };
        
          Speech.speak(lastSpoken, options);
        };
        
      speak();     
    } catch (error) {
      Speech.speak("Failed to send image", {language: "en-US"});
      console.error('Error sending image:', error);
    }  };

  return (
    <View style={styles.container}>
      <View style={styles.streamContainer}>
        {!isConnected && <Text>Connecting...</Text>}
        {streamData && (
          <Image source={{ uri: streamData }} style={styles.streamImage} />
        )}
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleButtonPress1} style={styles.button}>
          <Text style={styles.buttonText}>Describe Image</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleButtonPress2} style={styles.button}>
          <Text style={styles.buttonText}>Read Text</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000' // Set background color to black
  },
  streamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  streamImage: {
    width: '90%', // Adjust as needed
    height: '90%', // Adjust as needed
    resizeMode: 'contain'
  },
  text: {
    color: '#FFFFFF' // Set text color to white
  },
  button: {
    borderColor: 'white',
    borderWidth: 1,
    padding: 10,
    width: 180,
    height: 72,
    borderRadius: 15,
    marginBottom: 55,
    justifyContent: 'center',
    padding: 10,
    width: 300,
  },
  row: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%', // Tüm genişliği kaplaması için
    marginBottom: 100,
    alignItems: 'center',
    paddingTop: 60,
  },
  buttonText: {
    fontSize: 24,
    color: 'white',
  }
});


export default StreamScreen;
