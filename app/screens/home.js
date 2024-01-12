import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from "expo-speech";
import { Audio } from 'expo-av';
import BeMyEyesLogo from '../images/logo_dark.jpg';
import CameraLogo from '../images/camera.png';
import MoneyLogo from '../images/money2.png';
import NavigationLogo from '../images/map2.png';
import VideoLogo from '../images/video.png';
import TextLogo from '../images/read-text.png';
import HatLogo from '../images/hat.jpeg';
import HomeLogo from '../images/home.png';
import ReplayLogo from '../images/replay.png';
import SettingsLogo from '../images/settings.png';
import VoiceLogo from "../images/microphone.png";
import StopVoice from "../images/stop-speech.png";
import * as Haptics from 'expo-haptics';

const HomePage = ({ onNavigate }) => {
  const navigation = useNavigation();
  const [recording, setRecording] = React.useState();
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

    if(text.includes("describe")) {
      navigation.navigate('Camera', { headerTitle: 'Describe Scene', endpointName: 'describeImage' });
    }
    else if(text.includes("count") || text.includes("money")) {
      navigation.navigate('Camera', { headerTitle: 'Count Money', endpointName: 'moneyPredict' });
    }
    else if(text.includes("read") || text.includes("text")) {
      navigation.navigate('Camera', { headerTitle: 'Read Text', endpointName: 'wordsImage' });
    }
    else if(text.includes("where")) {
      navigation.navigate('WhereAmI');
    }
    else if(text.includes("record") || text.includes("video") || text.includes("capture"))  {
      navigation.navigate('Video');
    }
    else if(text.includes("smart") || text.includes("hat"))  {
      navigation.navigate('StreamScreen');
    }
    else if(text.includes("help")) {
      Speech.speak("You can say: describe, count money, read text, where am i, video capture, and smart hat", {language: "en-US"});
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
  
  const openCamera = (headerTitle, endpointName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Camera', { headerTitle, endpointName });
  };

  const openVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Video');
  };
  
  const openWhereAmI = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('WhereAmI');
  };


  const openHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Home');
  };

  const openHat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('StreamScreen');
  };

  const replaySound = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lastSpoken = await AsyncStorage.getItem("lastSpoken");
    setSpeaking(true);
    Speech.speak(lastSpoken, { onDone: () => setSpeaking(false), language: "en-US" });
  };

  const stopSpeech = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Speech.stop();
    setSpeaking(false);
  };

  const openSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
   
      <Image source={BeMyEyesLogo} style={styles.image} />

      <View style={styles.row}>

        <TouchableOpacity onPress={() => openCamera('Describe Scene','describeImage')} style={styles.button}>
        <Image source={CameraLogo} style={styles.imageLogo} />
          <Text style={styles.cameraImageText}>Describe Scene</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openCamera('Count Money', 'moneyPredict')} style={styles.button}>
        <Image source={MoneyLogo} style={styles.moneyImageLogo} />
          <Text style={styles.buttonText}>Count Money</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={() => openWhereAmI('Where Am I?')} style={styles.button}>
        <Image source={NavigationLogo} style={styles.navigationImageLogo} />
          <Text style={styles.buttonText}>Where Am I?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openVideo()} style={styles.button}>
        <Image source={VideoLogo} style={styles.videoImageLogo} />
          <Text style={styles.buttonText}>Video Capture</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={() => openCamera('Read Text', 'wordsImage')} style={styles.button}>
        <Image source={TextLogo} style={styles.readTextImageLogo} />
          <Text style={styles.buttonText}>Read Text</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openHat()} style={styles.button}>
        <Image source={HatLogo} style={styles.hatImageLogo} />
          <Text style={styles.hatButtonText}>Smart Hat</Text>
        </TouchableOpacity>

      


      </View>


      <View style={styles.lineStyle} />

     

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

        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={openSettings}
        >
          <Image source={SettingsLogo} style={styles.homeImageLogo} />
          <Text style={styles.footerButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
const { width, height } = Dimensions.get('window');
const imageWidthRatio = 0.35; // Logolar için genişlik oranı
const imageHeightRatio = 0.13; // Logolar için yükseklik oranı

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: 'center',
    padding: 15,
  },
  mainHeader: {
    justifyContent: 'center',
    width: width * 0.95, // Ekran genişliğinin %95'i
    height: height * 0.17, // Ekran yüksekliğinin %25'i
    fontSize: width < 400 ? 44 : 52, // Küçük ekranlar için daha küçük font boyutu
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: height * 0.06, // relative to screen height
  },
  button: {
    borderColor: 'black',
    borderWidth: 1,
    width: width * 0.4, // relative to screen width
    height: height * 0.1, // relative to screen height
    borderRadius: 15,
  },
  
  footerButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
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
  headerText: {
    justifyContent: 'flex-start',
    width: width * 0.95, // Ekran genişliğinin %95'i
    height: height * 0.25, // Ekran yüksekliğinin %25'i
    padding: 20,
    fontSize: width < 400 ? 36 : 44, // Küçük ekranlar için daha küçük font boyutu
    color: 'white',
    textAlign: 'center',
  },
  image: {
    width: width * 1, // Ekran genişliğinin %80'i
    height: height * 0.29, // Ekran yüksekliğinin %25'i
    marginBottom: -height * 0.05,
    resizeMode: 'contain',
    justifyContent: 'center',
    
  },

  imageLogo: {
    width: width * imageWidthRatio, // Ekran genişliğinin %20'si
    height: height * imageHeightRatio, // Ekran yüksekliğinin %10'u
    alignSelf: 'center',
  },


  moneyImageLogo: {
    width: width * imageWidthRatio,
    height: height * imageHeightRatio,
    marginLeft: width * 0.05,
    alignSelf: 'center',
  },
  navigationImageLogo: {
    width: width * imageWidthRatio,
    height: height * imageHeightRatio,
    marginLeft: width * 0.02,
    marginBottom: height * 0.005,
    alignSelf: 'center',
    marginTop: height * 0.02,
  },
  readTextImageLogo: {
    width: width * imageWidthRatio,
    height: height * imageHeightRatio,
    marginLeft: width * 0.02,
    marginBottom: height * 0.005,
    alignSelf: 'center',
    marginTop: height * 0.03,
  },
  videoImageLogo: {
    width: width * imageWidthRatio,
    height: height * imageHeightRatio,
    marginLeft: width * 0.04,
    marginBottom: height * 0.005,
    alignSelf: 'center',
    marginTop: height * 0.02,

  },
  hatImageLogo: {
    width: width * imageWidthRatio * 1.1, // Biraz daha geniş
    height: height * imageHeightRatio,
    marginLeft: width * 0.04,
    marginBottom: height * 0.003,
    alignSelf: 'center',
    marginTop: height * 0.03,
  },
  homeImageLogo: {
    width: width * 0.1,
    height: height * 0.05,
    marginBottom: -height * 0.001,
    alignSelf: 'center',
  },
  settingsImageLogo: {
    width: width * 0.09,
    height: height * 0.05,
    marginLeft: width * 0.05,
    marginBottom: height * 0.01,
    alignSelf: 'center',
  },
  

  lineStyle: {
    height: 1, // Çizginin kalınlığı
    backgroundColor: 'white', // Çizginin rengi
    width: '100%', // Genişlik, ekranın %100'ünü kaplasın
    alignSelf: 'center', // Çizgiyi ekranda ortala
    marginVertical: height * 0.05, // Üst ve altında 20 piksel boşluk bırak
  },

  
  lineContainer: {
    backgroundColor: 'black', // Arka plan rengini siyah yap
    width: '100%', // Genişlik, ekranın %100'ünü kaplasın
  },


  cameraImageText: {
    fontSize: width < 400 ? 19 : 23, // Küçük ekranlar için daha küçük font boyutu
    color: 'white',
    textAlign: 'center',
  },

  buttonText: {
    fontSize: width < 400 ? 20 : 24, // Küçük ekranlar için daha küçük font boyutu
    color: 'white',
    textAlign: 'center',
  },
  hatButtonText: {
    fontSize: width < 400 ? 20 : 24, // Küçük ekranlar için daha küçük font boyutu
    color: 'white',
    textAlign: 'center',
  },
});


export default HomePage;
