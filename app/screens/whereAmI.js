import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Share, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView from 'react-native-maps';
import * as Location from "expo-location";
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeLogo from '../images/home.png';
import ReplayLogo from '../images/replay.png';
import VoiceLogo from "../images/microphone.png";
import StopVoice from "../images/stop-speech.png";
import { Audio } from 'expo-av';

function WhereAmI({ onNavigate }) {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [recording, setRecording] = useState();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let locationSubscription;
  
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
  
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          //distanceInterval: 5,
        },
        (newLocation) => {
          //console.log(newLocation);
          setLocation(newLocation);
        }
      );
    })();
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
    
  }, []);

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

      if(text.includes("open") || text.includes("map")) {
        openMaps();
      }
      else if(text.includes("share") || text.includes("location")) {
        shareLocation();
      }
      else if(text.includes("help")) {
        Speech.speak("You can say: open maps, share location", {language: "en-US"});
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

  const openMaps = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Speech.speak("Failed to open maps", {language: "en-US"});
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };

  const shareLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`;
    await Share.share({message: `My location: ${url}`});
  }

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          customMapStyle={mapStyle}
          showsUserLocation={true}
          followsUserLocation={true}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          region={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0060,
            longitudeDelta: 0.0060,
          }}
        />
      ) : (
        <MapView style={styles.map} customMapStyle={mapStyle}/>
      )}
      <View style={styles.row}>
        <TouchableOpacity onPress={() => openMaps()} style={styles.button}>
          <Text style={styles.buttonText}>Open In Maps</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => shareLocation()} style={styles.button}>
          <Text style={styles.buttonText}>Share Location</Text>
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
    justifyContent: 'center',
    backgroundColor: '#000000',
    padding: 10,
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
  row: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%', // Tüm genişliği kaplaması için
    marginBottom: 150,
    alignItems: 'center',
    paddingTop: 60,
  },
  googleButton: {
    height: 67,
    width: 355,
    borderColor: 'black',
    borderWidth: 1,
    padding: 10,
    borderRadius: 40,
    backgroundColor: 'gray',
    justifyContent: 'flex-start',
    marginBottom: 25,
  },
  button: {
    borderColor: 'white',
    borderWidth: 1,
    padding: 20,
    width: 180,
    height: 72,
    borderRadius: 15,
    marginBottom: 55,
    justifyContent: 'center',
    width: 300,
  },
  buttonText: {
    fontSize: 24,
    color: 'white',
  },
  text: {
    fontSize: 14,
    color: 'white',
  },
  headerText: {
    justifyContent: 'flex-start',
    width: 392,
    height: 208,
    padding: 100,
    fontSize: 44,
    color: 'white',
    marginBottom: 55,
  
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  signInLink: {
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#58CECE'
  },
  link: {
    justifyContent: 'flex-end',
    backgroundColor: '#58CECE'
  },
  map: {
    width: "100%",
    height: "65%",
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

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8ec3b9"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1a3646"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#64779e"
      }
    ]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#334e87"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#283d6a"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6f9ba5"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3C7680"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#304a7d"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#98a5be"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2c6675"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#255763"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#b0d5ce"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#98a5be"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#283d6a"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3a4762"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0e1626"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#4e6d70"
      }
    ]
  }
]

export default WhereAmI;
