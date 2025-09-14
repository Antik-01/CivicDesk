// screens/UploadReportScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, ActivityIndicator, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DropDownPicker from 'react-native-dropdown-picker';
import api from '../services/api';

const CATEGORIES = [
  { label: 'Infrastructure', value: 'infrastructure' },
  { label: 'Environment', value: 'environment' },
  { label: 'Public Safety', value: 'public_safety' },
];

const UploadReportScreen = () => {
  const [text, setText] = useState('');
  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location access is required to use this feature.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Media library access is required to upload an image.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!text || !category || !location) {
      Alert.alert('Incomplete form', 'Please fill out all required fields.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('text', text);
    formData.append('latitude', location.coords.latitude);
    formData.append('longitude', location.coords.longitude);
    formData.append('category', category);

    if (image) {
      const filename = image.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';
      
      formData.append('file', {
        uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
        name: filename,
        type: type,
      });
    }

    try {
      await api.post('/api/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      Alert.alert('Success', 'Report uploaded successfully!');
      setText('');
      setImage(null);
      setCategory(null);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Upload failed.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload a New Report</Text>
      <TextInput
        style={styles.input}
        placeholder="Report Description"
        value={text}
        onChangeText={setText}
        multiline
      />
      <View style={styles.locationContainer}>
        <Text style={styles.locationText}>
          Latitude: {location ? location.coords.latitude.toFixed(4) : 'Loading...'}
        </Text>
        <Text style={styles.locationText}>
          Longitude: {location ? location.coords.longitude.toFixed(4) : 'Loading...'}
        </Text>
      </View>
      <View style={styles.pickerContainer}>
        <DropDownPicker
          open={open}
          value={category}
          items={CATEGORIES}
          setOpen={setOpen}
          setValue={setCategory}
          placeholder="Select a category"
          containerStyle={styles.pickerStyle}
          style={styles.pickerDropdown}
          dropDownContainerStyle={styles.pickerDropdownContainer}
        />
      </View>
      <View style={styles.imagePickerContainer}>
        <Button title="Pick an image" onPress={pickImage} />
        {image && <Image source={{ uri: image.uri }} style={styles.thumbnail} />}
      </View>
      <Button
        title={loading ? 'Uploading...' : 'Submit Report'}
        onPress={handleUpload}
        disabled={loading}
      />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    minHeight: 100,
  },
  locationContainer: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
  },
  pickerContainer: {
    zIndex: 1000,
  },
  pickerStyle: {
    height: 50,
    marginBottom: 15,
  },
  pickerDropdown: {
    backgroundColor: '#fff',
  },
  pickerDropdownContainer: {
    backgroundColor: '#fafafa',
  },
  imagePickerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  thumbnail: {
    width: 200,
    height: 200,
    marginTop: 10,
    borderRadius: 8,
  },
});

export default UploadReportScreen;