import React, { useState } from 'react';
import { View, TextInput, Text, Button, StyleSheet, Dimensions, ImageBackground, KeyboardAvoidingView,Platform,Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundLogo from '../images/background.png';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

function SignIn({ onNavigate }) {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const openSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('SignUp');
  };

  const handleEmailChange = (email) => {
    setEmail(email);
    setEmailError(null);
  };

  const handlePasswordChange = (password) => {
    setPassword(password);
    setPasswordError(null);
  };

  const handleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let e_error = false;
    let p_error = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
      e_error = true;
      setEmailError("Invalid email address!");
      Speech.speak("Invalid email address", {language: "en-US"});
    }
    if (password.length < 6) {
      p_error = true;
      setPasswordError('Password must be at least 6 characters');
      Speech.speak("Password must be at least 6 characters", {language: "en-US"});
    }
    if (p_error || e_error) {
      return;
    }
    // Here you would usually send the email and password to your server
    console.log('Sign in with', email, password);
    const url = "https://bemyeyesdeploy.azurewebsites.net/api/auth/login";
    const data = {
        email: email,
        password: password
    };
    let jsonData = JSON.stringify(data);
    const response = await fetch(url, {
        method: 'POST',
        body: jsonData, //Burası formdata olucak image ep leri için.
        headers: {
            Accept: 'application/json',
            "Content-Type": 'application/json',
        },
    });
    if(response.ok){
      await AsyncStorage.setItem('userToken', "test");
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      });
    }
    else{
      Speech.speak("Unable to sign in", {language: "en-US"});
      return;
    }
  };

  return (
        <View style={styles.container}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
            <KeyboardAvoidingView 
              style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >

          <ImageBackground source={BackgroundLogo} style={styles.imageBackground} resizeMode="cover">
            <Text style={styles.transparentText}>BeMyEyes</Text>
          </ImageBackground>

          <View style={styles.container}>
            <TextInput
              style={styles.googleButton}
              onChangeText={handleEmailChange}
              value={email}
              placeholder="Enter your e-mail"
              autoCapitalize="none"
              placeholderTextColor="white"
            />
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}

            <TextInput
              style={styles.googleButton}
              onChangeText={handlePasswordChange}
              value={password}
              placeholder="Enter your password"
              placeholderTextColor="white"
              autoCapitalize="none"
              secureTextEntry
            />
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}


          
          <Button title="Sign In" style={styles.signInLink} onPress={handleSignIn} />
        </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
        <Button title="Don't have an account? Sign Up" style={styles.link} onPress={openSignUp} />
        
        </View>

        
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
  googleButton: {
    height: height * 0.08, // Ekran yüksekliğinin %8'i
    width: width * 0.9, // Ekran genişliğinin %90'ı
    borderColor: 'black',
    borderWidth: 1,
    padding: 10,
    borderRadius: width * 0.1, // Ekran genişliğinin %10'u
    backgroundColor: 'gray',
    justifyContent: 'flex-start',
    marginBottom: 25,
    alignSelf: 'center',
    color: "white"
  },
  button: {
    backgroundColor: '#9C9A9A',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: width * 0.04, // Ekran genişliğinin %4'ü
  },
  text: {
    fontSize: width * 0.035, // Ekran genişliğinin %3.5'i
    color: 'white',
  },
  headerText: {
    justifyContent: 'flex-start',
    width: width * 0.95, // Ekran genişliğinin %95'i
    padding: 20,
    fontSize: width * 0.11, // Ekran genişliğinin %11'i
    color: 'white',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    justifyContent: 'flex-start',
    alignSelf: 'center',
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
  imageBackground: {
    width: width * 1, // Ekran genişliğinin %80'i
    height: height * 0.3, // Ekran yüksekliğinin %25'i
    marginTop: height * 0.09,
    opacity: 0.5,
  },
  transparentText: {
    color: 'rgba(0, 0, 0, 0.8)', 
    fontSize: width * 0.16, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginTop: height * 0.1, 
  },
});

export default SignIn;
