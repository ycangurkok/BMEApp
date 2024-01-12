import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { View, Image, StyleSheet, Button, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import base64 from 'react-native-base64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import HomeLogo from '../images/home.png';
import ReplayLogo from '../images/replay.png';
import VoiceLogo from "../images/microphone.png";
import StopVoice from "../images/stop-speech.png";
import { Audio } from 'expo-av';

function StreamScreen() {
  const [streamData, setStreamData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const navigation = useNavigation();
  const wsRef = useRef(null); // Use useRef for the WebSocket instance
  const [recording, setRecording] = useState();
  const [speaking, setSpeaking] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#000', // Set the header background color
      },
      headerTintColor: '#fff', 
    });
  }, [navigation]);

  function voiceCmd(text) {
    text = text.replace(/\W/g, '');
    text = text.toLowerCase();
    console.log(text);

    if(text.includes("Describe") || text.includes("Image")) {
      handleButtonPress1();
    }
    else if(text.includes("Read") || text.includes("Text")) {
      handleButtonPress2();
    }
    else if(text.includes("help")) {
      Speech.speak("You can say: describe image, and read text", {language: "en-US"});
    }
    else {
      Speech.speak("Sorry, I didn't get that. To see available commands, please say help", {language: "en-US"});
    }
  }

async function startRecording() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
        Speech.speak("Failed to start recording", {language: "en-US"});
        console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Stopping recording..');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    const fileName = uri.match(/[^\/]+$/)[0];
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer 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");
    myHeaders.append("Content-Type", "multipart/form-data");
    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      type: 'audio/mp4',
      name: fileName,
    });
    formData.append("model", "whisper-1");
    const endPointAddr = "https://api.openai.com/v1/audio/transcriptions";
    const response = await fetch(endPointAddr, {
      method: 'POST',
      headers: myHeaders,
      body: formData,
    });
    if (response.ok) {
      console.log('Audio uploaded successfully');
      const responseData = await response.json();
      voiceCmd(responseData.text);
    } else {
        Speech.speak("Failed to upload audio", {language: "en-US"});
      console.error('Failed to upload audio');
      console.log(response.json());
    }
    
  }

const openHome = () => {
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
navigation.navigate('Home');
};

const replaySound = async () => {
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
const lastSpoken = await AsyncStorage.getItem("lastSpoken");
setSpeaking(true);
Speech.speak(lastSpoken, { onDone: () => setSpeaking(false) , language: "en-US"});
};

const stopSpeech = async () => {
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
Speech.stop();
setSpeaking(false);
};
  
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
      <View style={styles.footer}>

                <TouchableOpacity 
                
                style={styles.footerButton} 
                onPress={openHome}
                >
                <Image source={HomeLogo} style={styles.homeImageLogo} />
                <Text style={styles.footerButtonText}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.footerButton} 
                    onPress={recording ? stopRecording : startRecording}
                    >
                    <Image source={VoiceLogo} style={styles.homeImageLogo} />
                    <Text style={styles.footerButtonText}>{recording ? "Stop" : "Voice"}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                style={styles.footerButton} 
                onPress={speaking ? stopSpeech : replaySound}
                >
                <Image style={styles.homeImageLogo} source={speaking ? StopVoice : ReplayLogo} />
                <Text style={styles.footerButtonText}>{speaking ? "Stop" : "Replay"}</Text>
                </TouchableOpacity>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const imageWidthRatio = 0.25; 
const imageHeightRatio = 0.1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000' // Set background color to black
  },
  streamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
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
  },
  footerButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#000',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  footerButtonText: {
    color: 'white',
    fontSize: height < 600 ? 14 : 16, // Küçük ekranlar için daha küçük font boyutu
    textAlign: 'center',
    alignSelf: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    width: '100%',
    height: height * 0.1, // Ekran yüksekliğinin %10'u
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeImageLogo: {
    width: width * 0.1,
    height: height * 0.05,
    alignSelf: 'center',
    paddingHorizontal: width * 0.05, // Ekran genişliğinin %5'i

  },
  takePicImageLogo: {
    width: width * imageWidthRatio,
    height: height * imageHeightRatio,
    marginBottom: height * 0.005,
    alignSelf: 'center',
  },
  lineStyle: {
    height: 1, // Çizginin kalınlığı
    backgroundColor: 'white', // Çizginin rengi
    width: '100%', // Genişlik, ekranın %100'ünü kaplasın
    alignSelf: 'center', // Çizgiyi ekranda ortala
    marginBottom: height * 0.1,
  },
  lineContainer: {
    backgroundColor: 'black', // Arka plan rengini siyah yap
    width: '100%', // Genişlik, ekranın %100'ünü kaplasın
  },
});


export default StreamScreen;
