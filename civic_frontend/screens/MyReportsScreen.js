// screens/MyReportsScreen.js
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ReportCard from '../components/ReportCard';
import api from '../services/api';

const MyReportsScreen = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/reports/my');
      setReports(response.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to fetch your reports.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMyReports();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ReportCard report={item} />}
        contentContainerStyle={reports.length === 0 && styles.centered}
        ListEmptyComponent={
          <Text style={styles.emptyText}>You haven't uploaded any reports yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
  },
});

export default MyReportsScreen;