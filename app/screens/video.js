import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation, useRoute } from '@react-navigation/native';
import FormData from "form-data";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from "expo-speech";
import HomeLogo from '../images/home.png';
import ReplayLogo from '../images/replay.png';
import SettingsLogo from '../images/settings.png';
import FlashOnLogo from '../images/flash.png';
import FlashOffLogo from '../images/flashOff.png';
import EllipseStart from '../images/ellipse_start.png';
import EllipseStop from '../images/ellipse_stop.png';
import TakePic2 from '../images/takePic2.png';
import TurnCameraLogo from '../images/turnCamera.png';
import RetakeLogo from '../images/retake.png';
import SaveLogo from '../images/save.png';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import GaleryLogo from '../images/galery.png';
import { Video, ResizeMode } from 'expo-av';


const VideoComponent = ({ onNavigate }) => {
    const navigation = useNavigation();
    const route = useRoute();

    const [cameraPermission, setCameraPermission] = useState(null);
    const [type, setType] = useState(Camera.Constants.Type.back);
    const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
    const cameraRef = useRef(); // Use useRef to create a ref
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [video, setVideo] = useState(null);
    let lastSpoken = "";
    const [headerTitle, setHeaderTitle] = useState('Default Camera');
    const [modalVisible, setModalVisible] = useState(false);

    useLayoutEffect(() => {
      navigation.setOptions({
        headerTitle: headerTitle,
        headerStyle: {
            backgroundColor: '#000', // Set the header background color
          },
          headerTintColor: '#fff',
      });
    }, [navigation, headerTitle]);

    useEffect(() => {
        (async () => {
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        const micStatus = await Camera.requestMicrophonePermissionsAsync();
        const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
        if (cameraStatus.status === 'granted' && mediaLibraryStatus.status === 'granted' && micStatus.status === 'granted') {
            setCameraPermission(true);
        } else {
            setCameraPermission(false);
        }

        })();
        setHeaderTitle("Video Capture");
        }, []);

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

    const toggleVideoRecording = async () => {
        const perms= await Camera.requestMicrophonePermissionsAsync();
        if (cameraRef.current) {
            if (isRecording) {
                const videoData = await cameraRef.current.stopRecording();
                setVideo(videoData);
                setIsRecording(false);
            } else {
                setIsRecording(true);
                cameraRef.current.recordAsync({
                    maxDuration: 5,
                }).then(data => {
                    setVideo(data);
                    setIsRecording(false);
                    
                });
            }
        }
    };
    
    const toggleFlash = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFlashMode(prevMode => 
            prevMode === Camera.Constants.FlashMode.off 
            ? Camera.Constants.FlashMode.torch
            : Camera.Constants.FlashMode.off
        );
      
    };

    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 1,
        });
        
        if (!result.canceled) {
            setVideo({ uri: result.assets[0].uri });
        }

        console.log(result.assets[0].uri)
    };


    const saveVideo = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (video) {
            let durationFlag = false;
            const videoAsset = await MediaLibrary.createAssetAsync(video.uri);
            const assetInfo = await MediaLibrary.getAssetInfoAsync(videoAsset);
            if(assetInfo && assetInfo.duration){
                const durationInSeconds = assetInfo.duration;
                if (durationInSeconds > 5){
                    Speech.speak("Videos cannot be longer than 5 seconds");
                    durationFlag = true;
                }
            }
            if(!durationFlag){
                try {
                    const formData = new FormData();
                    formData.append('VideoFile', {
                        uri: video.uri,
                        type: 'video/mp4',
                        name: 'video.mp4',
                    });
                
                    let endpointName = "summarizeVideo"
     
                    const response = await fetch('https://bemyeyesdeploy.azurewebsites.net/api/ImageAnalysis/'+ endpointName, {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                        },
                        body: formData,
                    });
            
                    if (response.ok) {
                        console.log('Video uploaded successfully');
                        let responseData = await response.json();           
                        console.log(responseData)
                        lastSpoken = String(responseData);
                        await AsyncStorage.setItem('lastSpoken', lastSpoken);
                        const speak = () => {
                            const options = {
                                language: "en-US",
                            };
                            Speech.speak(lastSpoken, options);
                        };
                        speak();              
                    } else {
                        console.error('Failed to upload video');
                        console.log(response);
                        console.error('Video upload failed. Status Code:', response.status);
                    }              
                } catch (error) {
                    console.error('Error uploading video', error);
                }
            }   
        } else {
            console.warn('No video to save');
        }
    }

    const closeCamera = () => {
        setIsCameraOpen(false);
    };

    return (
        
        <View style={styles.camera}>
       
            {!video ? (
                <Camera
                    style={styles.camera}
                    type={type}
                    flashMode={flashMode}
                    ref={cameraRef}
                    >
                </Camera>
            ) : (
                <Video
                    style={styles.camera}
                    source={{
                    uri: video.uri,
                    }}
                    resizeMode={ResizeMode.STRETCH}
                    isLooping
                />
            )}
            <View style={styles.lineContainer}>
            {video ? 
                <View style={styles.takePicButton}>
                   
                    <TouchableOpacity 
                        style={styles.footerButton} 
                        onPress={() => setVideo(null)}
                    >
                        <Image source={RetakeLogo} style={styles.takePicImageLogo} />     
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.footerButton} 
                        onPress={saveVideo}
                    >
                        <Image source={SaveLogo} style={styles.takePicImageLogo} />     
                    </TouchableOpacity>

                </View>
                :
                <View style={styles.takePicButton}>
               
                    <TouchableOpacity 
                            style={styles.footerButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setType(type === CameraType.back ? CameraType.front : CameraType.back);
                            }}
                        >
                        <Image source={TurnCameraLogo} style={styles.homeImageLogo} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.footerButton} 
                        onPress={toggleVideoRecording}>
                        {isRecording ? (
                            <Image source={EllipseStop} style={styles.takePicImageLogo} /> 
                        ) : (
                            <Image source={EllipseStart} style={styles.takePicImageLogo} /> 
                        )}   
                    </TouchableOpacity>

                    <TouchableOpacity 
                            style={styles.footerButton} 
                            onPress={toggleFlash}
                        >
                        <Image                                 
                            source={flashMode === Camera.Constants.FlashMode.torch ? FlashOnLogo : FlashOffLogo} 
                            style={styles.homeImageLogo} 
                        />
                        <Text style={styles.flashText}>
                            {flashMode === Camera.Constants.FlashMode.on ? "Disable Flashlight" : "Enable Flashlight"}
                        </Text>
                    </TouchableOpacity>
             
                </View>
                
                
            }
                <View style={styles.lineStyle} />
           </View>
            
            <View style={styles.footer}>
        
                <TouchableOpacity 
                    style={styles.footerButton} 
                    onPress={(pickImage)}
                >
                <Image source={GaleryLogo} style={styles.homeImageLogo} />
                <Text style={styles.footerButtonText}>Galery</Text>
                </TouchableOpacity>

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
const imageWidthRatio = 0.25; 
const imageHeightRatio = 0.1; 

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        padding: 15,
      },
      camera: {
        flex: 1,
        height: height * 0.4, // Ekran yüksekliğinin %40'ı
      },
      takePicButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'black',
        alignSelf: 'center',
        height: height * 0.05, // Ekran yüksekliğinin %5'i
        marginVertical: height * 0.042,
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

export default VideoComponent;