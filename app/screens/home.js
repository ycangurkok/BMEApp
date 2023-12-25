import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from "expo-speech";
import BeMyEyesLogo from '../images/logo_dark.jpg';
import CameraLogo from '../images/camera.png';
import MoneyLogo from '../images/money.png';
import NavigationLogo from '../images/navigation.png';
import VideoLogo from '../images/video.png';
import TextLogo from '../images/text.png';
import HatLogo from '../images/hat.png';
import HomeLogo from '../images/home.png';
import ReplayLogo from '../images/replay.png';
import SettingsLogo from '../images/settings.png';
import * as Haptics from 'expo-haptics';

const HomePage = ({ onNavigate }) => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#000', // Set the header background color
      },
      headerTintColor: '#fff', // Optional: Set the header text and icons color
    });
  }, [navigation]);

 
  const openCamera = (headerTitle, endpointName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Camera', { headerTitle, endpointName });
  };

  const openWhereAmI = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('WhereAmI');
  };


  const openHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Home');
  };

  const replaySound = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lastSpoken = await AsyncStorage.getItem("lastSpoken");
    Speech.speak(lastSpoken);
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

        <TouchableOpacity onPress={() => openCamera('Video Capture')} style={styles.button}>
        <Image source={VideoLogo} style={styles.videoImageLogo} />
          <Text style={styles.buttonText}>Video Capture</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={() => openCamera('Read Text', 'wordsImage')} style={styles.button}>
        <Image source={TextLogo} style={styles.navigationImageLogo} />
          <Text style={styles.buttonText}>Read Text</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openCamera('Smart Hat')} style={styles.button}>
        <Image source={HatLogo} style={styles.hatImageLogo} />
          <Text style={styles.hatButtonText}>Smart Hat</Text>
        </TouchableOpacity>
        
      </View>
    
      <View style={styles.lineContainer}>
        <View style={styles.lineStyle} />
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
          onPress={replaySound}
        >
          <Image source={ReplayLogo} style={styles.homeImageLogo} />
          <Text style={styles.footerButtonText}>Replay</Text>
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
const imageWidthRatio = 0.233; // Logolar için genişlik oranı
const imageHeightRatio = 0.1; // Logolar için yükseklik oranı

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
    marginBottom: height * 0.05, // relative to screen height
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
    marginBottom: height * 0.01,
    resizeMode: 'contain',

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
  },
  videoImageLogo: {
    width: width * imageWidthRatio,
    height: height * imageHeightRatio,
    marginLeft: width * 0.04,
    marginBottom: height * 0.005,
    alignSelf: 'center',
  },
  hatImageLogo: {
    width: width * imageWidthRatio * 1.25, // Biraz daha geniş
    height: height * imageHeightRatio,
    marginLeft: -width * 0.02,
    marginBottom: height * 0.005,
    alignSelf: 'center',
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
    marginVertical: height * 0.01, // Üst ve altında 20 piksel boşluk bırak
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
