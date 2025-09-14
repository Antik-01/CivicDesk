import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return '#ff9500';
    case 'resolved':
      return '#34c759';
    case 'rejected':
      return '#ff3b30';
    default:
      return '#666';
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'infrastructure':
      return 'construct-outline';
    case 'safety':
      return 'shield-outline';
    case 'environment':
      return 'leaf-outline';
    case 'traffic':
      return 'car-outline';
    default:
      return 'document-outline';
  }
};

export default function ReportCard({ report, showUsername = false }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Ionicons
            name={getCategoryIcon(report.category)}
            size={20}
            color="#007AFF"
          />
          <Text style={styles.category}>{report.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
          <Text style={styles.statusText}>{report.status || 'pending'}</Text>
        </View>
      </View>

      <Text style={styles.text}>{report.text}</Text>

      {report.image_url && (
        <Image source={{ uri: report.image_url }} style={styles.image} />
      )}

      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.location}>
          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
        </Text>
      </View>

      <View style={styles.footer}>
        {showUsername && (
          <View style={styles.userContainer}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.username}>{report.username}</Text>
          </View>
        )}
        <Text style={styles.date}>{formatDate(report.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
});